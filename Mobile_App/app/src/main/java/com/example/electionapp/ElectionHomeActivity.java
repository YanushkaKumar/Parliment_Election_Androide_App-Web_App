package com.example.electionapp;

import android.annotation.SuppressLint;
import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.google.firebase.firestore.DocumentSnapshot;
import com.google.firebase.firestore.FirebaseFirestore;

import java.util.ArrayList;
import java.util.List;

import jp.wasabeef.blurry.Blurry;

public class ElectionHomeActivity extends AppCompatActivity {

    public static final String EXTRA_ELECTION_ID = "ELECTION_ID";
    public static final String EXTRA_ELECTION_NAME = "ELECTION_NAME";
    public static final String EXTRA_ELECTION_DATE = "ELECTION_DATE";
    public static final String EXTRA_ELECTION_START = "ELECTION_START";
    public static final String EXTRA_ELECTION_END = "ELECTION_END";

    private FirebaseFirestore db;
    private ElectionAdapter electionAdapter;
    private final List<Election> electionList = new ArrayList<>();
    private TextView textViewGreeting;
    private ViewGroup rootLayout;
    private String voterId;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        voterId = Session.voterId();
        if (voterId == null) {
            Session.logout(this);
            return;
        }

        setContentView(R.layout.activity_election_home);
        db = FirebaseFirestore.getInstance();
        textViewGreeting = findViewById(R.id.textViewGreeting);
        rootLayout = findViewById(android.R.id.content);

        RecyclerView recyclerView = findViewById(R.id.recyclerViewElections);
        recyclerView.setLayoutManager(new LinearLayoutManager(this));
        electionAdapter = new ElectionAdapter(electionList, this::onElectionClick);
        recyclerView.setAdapter(electionAdapter);

        findViewById(R.id.buttonLogout).setOnClickListener(v ->
                new AlertDialog.Builder(this)
                        .setMessage("Log out of the Election App?")
                        .setPositiveButton(R.string.logout, (d, w) -> Session.logout(this))
                        .setNegativeButton(android.R.string.cancel, null)
                        .show());

        loadVoterName();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (db != null) loadElections(); // refresh statuses when returning to the screen
    }

    public static void putElection(Intent intent, Election e) {
        intent.putExtra(EXTRA_ELECTION_ID, e.getId());
        intent.putExtra(EXTRA_ELECTION_NAME, e.getName());
        intent.putExtra(EXTRA_ELECTION_DATE, e.getDate());
        intent.putExtra(EXTRA_ELECTION_START, e.getStartTime());
        intent.putExtra(EXTRA_ELECTION_END, e.getEndTime());
    }

    public static Election getElection(Intent intent) {
        String id = intent.getStringExtra(EXTRA_ELECTION_ID);
        String name = intent.getStringExtra(EXTRA_ELECTION_NAME);
        String date = intent.getStringExtra(EXTRA_ELECTION_DATE);
        if (id == null || name == null || date == null) return null;
        return new Election(id, name, date,
                intent.getStringExtra(EXTRA_ELECTION_START), intent.getStringExtra(EXTRA_ELECTION_END));
    }

    private void onElectionClick(Election election) {
        switch (ElectionTime.status(election)) {
            case OPEN:
                showOpenElectionDialog(election);
                break;
            case CLOSED:
                showClosedElectionDialog(election);
                break;
            case UPCOMING:
                Toast.makeText(this, "Voting opens on " + election.getDate() + " at "
                        + election.getStartTime(), Toast.LENGTH_SHORT).show();
                break;
            default:
                Toast.makeText(this, "This election has an invalid date", Toast.LENGTH_SHORT).show();
        }
    }

    private AlertDialog showBlurredDialog(View view) {
        AlertDialog dialog = new AlertDialog.Builder(this).setView(view).setCancelable(true).create();
        Blurry.with(this).radius(6).sampling(4).async().onto(rootLayout);
        dialog.setOnDismissListener(d -> Blurry.delete(rootLayout));
        dialog.show();
        return dialog;
    }

    private void showOpenElectionDialog(Election election) {
        View view = LayoutInflater.from(this).inflate(R.layout.dialog_election, null);
        ((TextView) view.findViewById(R.id.textViewElectionTitle)).setText(election.getName());
        Button voteButton = view.findViewById(R.id.buttonVote123);
        Button resultButton = view.findViewById(R.id.buttonResult);
        AlertDialog dialog = showBlurredDialog(view);

        voteButton.setOnClickListener(v -> {
            Intent intent = new Intent(this, VotingActivity.class);
            putElection(intent, election);
            startActivity(intent);
            dialog.dismiss();
        });

        // While voting is open, results are shown only to voters who have used all their votes.
        resultButton.setEnabled(false);
        db.collection("voterVotes").document(election.getId() + "_" + voterId).get()
                .addOnSuccessListener(doc -> {
                    Long count = doc.getLong("count");
                    resultButton.setEnabled(count != null && count >= ElectionTime.MAX_VOTES);
                });
        resultButton.setOnClickListener(v -> {
            openResults(election);
            dialog.dismiss();
        });
    }

    private void showClosedElectionDialog(Election election) {
        View view = LayoutInflater.from(this).inflate(R.layout.dialo_election_end, null);
        ((TextView) view.findViewById(R.id.textViewElectionEndTitle)).setText(election.getName());
        AlertDialog dialog = showBlurredDialog(view);
        view.findViewById(R.id.buttonelectionEndResult).setOnClickListener(v -> {
            openResults(election);
            dialog.dismiss();
        });
    }

    private void openResults(Election election) {
        Intent intent = new Intent(this, ResultActivity.class);
        putElection(intent, election);
        startActivity(intent);
    }

    private void loadVoterName() {
        db.collection("voters").document(voterId).get()
                .addOnSuccessListener(doc -> {
                    if (!doc.exists()) {
                        Toast.makeText(this, "Your voter registration was not found.", Toast.LENGTH_LONG).show();
                        Session.logout(this);
                        return;
                    }
                    String name = doc.getString("name");
                    textViewGreeting.setText(name != null ? "Hello, " + name + "!" : "Hello, Voter!");
                })
                .addOnFailureListener(e -> textViewGreeting.setText("Hello, Voter!"));
    }

    @SuppressLint("NotifyDataSetChanged")
    private void loadElections() {
        db.collection("elections").get()
                .addOnSuccessListener(snapshot -> {
                    electionList.clear();
                    for (DocumentSnapshot doc : snapshot.getDocuments()) {
                        Election e = Election.fromDocument(doc);
                        if (e != null) electionList.add(e);
                    }
                    // Newest first.
                    electionList.sort((a, b) -> b.getDate().compareTo(a.getDate()));
                    electionAdapter.notifyDataSetChanged();
                })
                .addOnFailureListener(e ->
                        Toast.makeText(this, "Error fetching elections", Toast.LENGTH_SHORT).show());
    }
}
