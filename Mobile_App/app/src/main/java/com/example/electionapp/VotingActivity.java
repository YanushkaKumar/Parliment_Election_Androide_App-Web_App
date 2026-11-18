package com.example.electionapp;

import android.annotation.SuppressLint;
import android.os.Bundle;
import android.os.CountDownTimer;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.google.firebase.firestore.DocumentSnapshot;
import com.google.firebase.firestore.FirebaseFirestore;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * Lists the candidates in the voter's constituency. Each vote is submitted to the castVote
 * Cloud Function, which checks the voting window, constituency, duplicates and the 3-vote limit.
 */
public class VotingActivity extends AppCompatActivity {

    private FirebaseFirestore db;
    private Election election;
    private String voterId;

    private final List<Candidate> candidates = new ArrayList<>();
    private final Set<String> votedDocIds = new HashSet<>();
    private int votesUsed = 0;

    private VotingAdapter adapter;
    private TextView timerView, votesRemainingView;
    private CountDownTimer timer;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        election = ElectionHomeActivity.getElection(getIntent());
        voterId = Session.voterId();
        if (election == null || voterId == null) {
            finish();
            return;
        }

        setContentView(R.layout.activity_voting);
        db = FirebaseFirestore.getInstance();
        timerView = findViewById(R.id.tvTimer);
        votesRemainingView = findViewById(R.id.tvVotesRemaining);
        ((TextView) findViewById(R.id.tvVotingTitle)).setText(election.getName());
        ((TextView) findViewById(R.id.tvInstructions)).setText(String.format(Locale.US,
                "You may vote for up to %d different candidates. Votes cannot be changed.",
                ElectionTime.MAX_VOTES));

        RecyclerView recyclerView = findViewById(R.id.recyclerViewCandidates);
        recyclerView.setLayoutManager(new LinearLayoutManager(this));
        adapter = new VotingAdapter(candidates, this::confirmVote);
        recyclerView.setAdapter(adapter);

        updateVotesRemaining();
        loadData();
    }

    @Override
    protected void onResume() {
        super.onResume();
        startTimer();
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (timer != null) timer.cancel();
    }

    /** Voter -> constituency -> candidates, plus the voter's existing votes. */
    private void loadData() {
        db.collection("voters").document(voterId).get()
                .addOnSuccessListener(voter -> {
                    String constituency = voter.getString("constituency");
                    if (constituency == null || constituency.isEmpty()) {
                        showMessage("Your constituency is not set. Please contact the election office.", true);
                        return;
                    }
                    loadVotes(() -> loadCandidates(constituency));
                })
                .addOnFailureListener(e -> showMessage("Unable to load your voter details.", true));
    }

    private void loadVotes(Runnable then) {
        db.collection("voterVotes").document(election.getId() + "_" + voterId).get()
                .addOnCompleteListener(task -> {
                    votesUsed = 0;
                    votedDocIds.clear();
                    DocumentSnapshot doc = task.isSuccessful() ? task.getResult() : null;
                    if (doc != null && doc.exists()) {
                        Long count = doc.getLong("count");
                        votesUsed = count != null ? count.intValue() : 0;
                        Object ids = doc.get("candidateDocIds");
                        if (ids instanceof List) {
                            for (Object id : (List<?>) ids) votedDocIds.add(String.valueOf(id));
                        }
                    }
                    updateVotesRemaining();
                    then.run();
                });
    }

    @SuppressLint("NotifyDataSetChanged")
    private void loadCandidates(String constituency) {
        db.collection("candidates")
                .whereEqualTo("electionName", election.getName())
                .whereEqualTo("constituency", constituency)
                .get()
                .addOnSuccessListener(snapshot -> {
                    candidates.clear();
                    for (DocumentSnapshot doc : snapshot.getDocuments()) {
                        Candidate c = Candidate.fromDocument(doc);
                        if (c == null) continue;
                        c.setVoted(votedDocIds.contains(c.getDocId()));
                        candidates.add(c);
                    }
                    candidates.sort((a, b) -> a.getCandidateName().compareToIgnoreCase(b.getCandidateName()));
                    adapter.notifyDataSetChanged();
                    refreshVotingEnabled();
                    if (candidates.isEmpty()) {
                        showMessage("No candidates are standing in your constituency for this election.", false);
                    }
                })
                .addOnFailureListener(e -> showMessage("Error loading candidates.", false));
    }

    private void confirmVote(Candidate candidate) {
        new AlertDialog.Builder(this)
                .setTitle("Confirm vote")
                .setMessage("Vote for " + candidate.getCandidateName() + " (" + candidate.getCandidateParty()
                        + ")?\n\nThis cannot be undone.")
                .setPositiveButton("Vote", (d, w) -> castVote(candidate))
                .setNegativeButton(android.R.string.cancel, null)
                .show();
    }

    private void castVote(Candidate candidate) {
        adapter.setPending(candidate.getDocId());
        Map<String, Object> data = new HashMap<>();
        data.put("electionId", election.getId());
        data.put("candidateId", candidate.getDocId());

        Session.functions().getHttpsCallable("castVote").call(data)
                .addOnSuccessListener(result -> {
                    Object used = result.getData() instanceof Map
                            ? ((Map<?, ?>) result.getData()).get("votesUsed") : null;
                    votesUsed = used instanceof Number ? ((Number) used).intValue() : votesUsed + 1;
                    votedDocIds.add(candidate.getDocId());
                    candidate.setVoted(true);
                    adapter.setPending(null);
                    updateVotesRemaining();
                    refreshVotingEnabled();
                    if (votesUsed >= ElectionTime.MAX_VOTES) {
                        new AlertDialog.Builder(this)
                                .setTitle("Voting complete")
                                .setMessage("You have used all your votes. Thank you for voting!")
                                .setPositiveButton("Back to elections", (d, w) -> finish())
                                .setCancelable(false)
                                .show();
                    } else {
                        Toast.makeText(this, "Vote recorded for " + candidate.getCandidateName(),
                                Toast.LENGTH_SHORT).show();
                    }
                })
                .addOnFailureListener(e -> {
                    adapter.setPending(null);
                    showMessage(Session.errorMessage(e, "Your vote could not be recorded. Please try again."), false);
                    // Server state may differ (e.g. voted on another device): reload.
                    loadData();
                });
    }

    private void updateVotesRemaining() {
        int remaining = Math.max(0, ElectionTime.MAX_VOTES - votesUsed);
        votesRemainingView.setText("Votes remaining: " + remaining);
    }

    private void refreshVotingEnabled() {
        boolean open = ElectionTime.status(election) == ElectionTime.Status.OPEN;
        adapter.setVotingEnabled(open && votesUsed < ElectionTime.MAX_VOTES);
        if (votesUsed >= ElectionTime.MAX_VOTES) {
            timerView.setText("All votes cast");
        }
    }

    private void startTimer() {
        if (timer != null) timer.cancel();
        long millis = ElectionTime.millisUntilClose(election);
        if (millis <= 0) {
            timerView.setText(ElectionTime.status(election) == ElectionTime.Status.UPCOMING
                    ? "Opens at " + election.getStartTime() : "Voting closed");
            refreshVotingEnabled();
            return;
        }
        timer = new CountDownTimer(millis, 1000) {
            @Override
            public void onTick(long left) {
                if (votesUsed >= ElectionTime.MAX_VOTES) return;
                long s = left / 1000;
                timerView.setText(String.format(Locale.US, "Closes in %02d:%02d:%02d", s / 3600, (s / 60) % 60, s % 60));
            }

            @Override
            public void onFinish() {
                timerView.setText("Voting closed");
                refreshVotingEnabled();
            }
        }.start();
        refreshVotingEnabled();
    }

    private void showMessage(String message, boolean finishAfter) {
        if (isFinishing()) return;
        new AlertDialog.Builder(this)
                .setMessage(message)
                .setPositiveButton(android.R.string.ok, finishAfter ? (d, w) -> finish() : null)
                .setCancelable(!finishAfter)
                .show();
    }

    @Override
    protected void onDestroy() {
        if (timer != null) timer.cancel();
        super.onDestroy();
    }
}
