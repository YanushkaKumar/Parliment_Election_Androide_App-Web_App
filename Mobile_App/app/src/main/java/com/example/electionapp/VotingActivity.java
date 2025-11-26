package com.example.electionapp;

import android.content.SharedPreferences;
import android.os.Bundle;
import android.os.CountDownTimer;
import android.os.Handler;
import android.text.TextUtils;
import android.util.Log;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.google.firebase.firestore.FirebaseFirestore;
import com.google.firebase.firestore.DocumentSnapshot;
import com.google.firebase.firestore.WriteBatch;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Calendar;
import java.util.Locale;
import java.util.Set;
import java.util.concurrent.TimeUnit;

public class VotingActivity extends AppCompatActivity implements VotingAdapter.OnVoteButtonClickListener {

    private static final String TAG = "VotingActivity";
    private FirebaseFirestore db;
    private RecyclerView recyclerViewCandidates;
    private VotingAdapter votingAdapter;
    private List<Candidate> candidateList;
    private String electionName, electionDateString, voterNIC;
    private boolean isVotingDisabled = false;
    private TextView timerTextView, votesRemainingTextView;
    private CountDownTimer voteTimer;
    private String voterConstituency;
    private Set<String> previouslyVotedCandidates = new HashSet<>();

    // Added constants for voting hours
    private static final int START_HOUR = 9;  // 9 AM
    private static final int END_HOUR = 16;   // 4 PM

    // Voting constants
    private static final int MAX_VOTES = 3; // Maximum votes per voter

    // SharedPreferences keys
    private static final String ELECTION_APP_PREFS = "ElectionAppPrefs";
    private static final String VOTED_KEY = "VOTED_KEY";
    private static final String TIMER_EXPIRED_KEY = "TIMER_EXPIRED_KEY";


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_voting);

        try {
            initializeComponents();
            setupRecyclerView();
            getIntentData();

            // Handle voting status check after a delay to ensure UI is ready
            new Handler().postDelayed(this::checkVotingStatus, 500);
        } catch (Exception e) {
            Log.e(TAG, "Error in onCreate: ", e);
            showToast("Error initializing the voting screen");
            finish();
        }
    }

    private void initializeComponents() {
        db = FirebaseFirestore.getInstance();
        recyclerViewCandidates = findViewById(R.id.recyclerViewCandidates);
        timerTextView = findViewById(R.id.tvTimer);
        votesRemainingTextView = findViewById(R.id.tvVotesRemaining);
        candidateList = new ArrayList<>();
    }

    private void setupRecyclerView() {
        recyclerViewCandidates.setLayoutManager(new LinearLayoutManager(this));
        votingAdapter = new VotingAdapter(candidateList, this);
        recyclerViewCandidates.setAdapter(votingAdapter);
    }

    private void getIntentData() {
        if (getIntent() == null) {
            throw new IllegalStateException("No intent data found");
        }

        electionName = getIntent().getStringExtra("ELECTION_NAME");
        electionDateString = getIntent().getStringExtra("ELECTION_DATE");
        String intentNIC = getIntent().getStringExtra("NIC");

        if (TextUtils.isEmpty(electionName) || TextUtils.isEmpty(intentNIC)) {
            throw new IllegalStateException("Missing required intent data");
        }

        SharedPreferences sharedPreferences = getSharedPreferences(ELECTION_APP_PREFS, MODE_PRIVATE);
        String prefsNIC = sharedPreferences.getString("NIC", "");

        if (!intentNIC.equals(prefsNIC)) {
            throw new IllegalStateException("NIC mismatch");
        }

        voterNIC = intentNIC;
        votingAdapter.setVoterNIC(voterNIC);

        // Load voted candidates from Firestore
        loadVotedCandidatesFromFirestore();

        // Fetch voter's constituency
        fetchVoterConstituency();
    }

    private void loadVotedCandidatesFromFirestore() {
        previouslyVotedCandidates.clear();

        db.collection("results")
                .whereEqualTo("voterNIC", voterNIC)
                .whereEqualTo("electionName", electionName)
                .get()
                .addOnSuccessListener(querySnapshot -> {
                    for (DocumentSnapshot document : querySnapshot) {
                        String candidateId = document.getString("candidateId");
                        if (!TextUtils.isEmpty(candidateId)) {
                            previouslyVotedCandidates.add(candidateId);
                        }
                    }

                    // Update adapter with voted candidates list
                    votingAdapter.setPreviouslyVotedCandidates(previouslyVotedCandidates);

                    // Update the UI to show remaining votes
                    updateVotesRemainingDisplay();

                    // Check if voting should be disabled
                    if (previouslyVotedCandidates.size() >= MAX_VOTES) {
                        isVotingDisabled = true;
                        votingAdapter.setVotingDisabled(true);
                        timerTextView.setText("All votes have been cast");
                        saveVoteState();
                    }

                    // If we have the candidate list, update it to mark voted candidates
                    if (!candidateList.isEmpty()) {
                        markVotedCandidates();
                    }
                })
                .addOnFailureListener(e -> {
                    Log.e(TAG, "Error loading voted candidates: ", e);
                    showToast("Error checking your voting status");
                });
    }

    private void markVotedCandidates() {
        for (Candidate candidate : candidateList) {
            candidate.setVoted(previouslyVotedCandidates.contains(candidate.getCandidateId()));
        }
        votingAdapter.notifyDataSetChanged();
    }

    private void updateVotesRemainingDisplay() {
        try {
            // Get votes used directly from Firestore count
            getVotesUsedFromFirestore(votesUsed -> {
                try {
                    int votesRemaining = MAX_VOTES - votesUsed;

                    // Make sure we don't show negative votes
                    votesRemaining = Math.max(0, votesRemaining);

                    final int finalVotesRemaining = votesRemaining;
                    runOnUiThread(() -> {
                        try {
                            votingAdapter.setVotesRemaining(finalVotesRemaining);
                            votesRemainingTextView.setText("Votes Remaining: " + finalVotesRemaining);

                            // If no votes remaining, disable voting
                            if (finalVotesRemaining <= 0) {
                                isVotingDisabled = true;
                                votingAdapter.setVotingDisabled(true);
                                timerTextView.setText("All votes have been cast");
                                saveVoteState();
                            }
                        } catch (Exception e) {
                            Log.e(TAG, "Error updating votes UI: ", e);
                        }
                    });
                } catch (Exception e) {
                    Log.e(TAG, "Error processing votes count: ", e);
                }
            });
        } catch (Exception e) {
            Log.e(TAG, "Error updating votes display: ", e);
        }
    }

    private void getVotesUsedFromFirestore(VotesCountCallback callback) {
        db.collection("results")
                .whereEqualTo("voterNIC", voterNIC)
                .whereEqualTo("electionName", electionName)
                .get()
                .addOnSuccessListener(querySnapshot -> {
                    int votesUsed = querySnapshot.size();
                    callback.onVotesCountReceived(votesUsed);
                })
                .addOnFailureListener(e -> {
                    Log.e(TAG, "Error getting votes count: ", e);
                    // Default to previouslyVotedCandidates size as fallback
                    callback.onVotesCountReceived(previouslyVotedCandidates.size());
                });
    }

    // Interface for vote count callback
    interface VotesCountCallback {
        void onVotesCountReceived(int count);
    }

    private void checkVotingStatus() {
        try {
            Calendar now = Calendar.getInstance();
            int currentHour = now.get(Calendar.HOUR_OF_DAY);

            SharedPreferences sharedPreferences = getSharedPreferences(ELECTION_APP_PREFS, MODE_PRIVATE);
            boolean hasVoted = sharedPreferences.getBoolean(VOTED_KEY + "_" + voterNIC + "_" + electionName, false);
            boolean hasTimerExpired = sharedPreferences.getBoolean(TIMER_EXPIRED_KEY + "_" + voterNIC + "_" + electionName, false);

            // Check if all votes have been used
            getVotesUsedFromFirestore(votesUsed -> {
                try {
                    if (votesUsed >= MAX_VOTES) {
                        runOnUiThread(() -> {
                            isVotingDisabled = true;
                            votingAdapter.setVotingDisabled(true);
                            timerTextView.setText("All votes have been cast");
                            votesRemainingTextView.setText("Votes Remaining: 0");
                            saveVoteState();
                        });
                    } else if (currentHour < START_HOUR || currentHour >= END_HOUR) {
                        runOnUiThread(() -> {
                            timerTextView.setText("All votes have been cast");
                            votesRemainingTextView.setText("Votes Remaining: 0");
                            timerTextView.setText("Voting is only allowed between 9:00 AM and 4:00 PM");
                        });
                    } else if (hasVoted || hasTimerExpired) {
                        runOnUiThread(() -> {
                            isVotingDisabled = true;
                            votingAdapter.setVotingDisabled(true);
                            timerTextView.setText("Voting is Done");
                        });
                    } else {
                        runOnUiThread(this::startVotingTimer);
                    }
                } catch (Exception e) {
                    Log.e(TAG, "Error handling voting status: ", e);
                    runOnUiThread(() -> showToast("Error checking voting status"));
                }
            });
        } catch (Exception e) {
            Log.e(TAG, "Error checking voting status: ", e);
            showToast("Error checking voting status");
        }
    }

    private void startVotingTimer() {
        if (voteTimer != null) {
            voteTimer.cancel();
        }

        Calendar now = Calendar.getInstance();
        Calendar end = Calendar.getInstance();
        end.set(Calendar.HOUR_OF_DAY, END_HOUR);
        end.set(Calendar.MINUTE, 0);
        end.set(Calendar.SECOND, 0);

        long timeUntilEnd = end.getTimeInMillis() - now.getTimeInMillis();
        if (timeUntilEnd <= 0) {
            isVotingDisabled = true;
            votingAdapter.setVotingDisabled(true);
            timerTextView.setText("Voting period has ended");
            saveTimerExpiredState();
            return;
        }

        voteTimer = new CountDownTimer(timeUntilEnd, 1000) {
            @Override
            public void onTick(long millisUntilFinished) {
                if (timerTextView != null) {
                    long hours = TimeUnit.MILLISECONDS.toHours(millisUntilFinished);
                    long minutes = TimeUnit.MILLISECONDS.toMinutes(millisUntilFinished) % 60;
                    long seconds = TimeUnit.MILLISECONDS.toSeconds(millisUntilFinished) % 60;

                    String timeLeft = String.format(Locale.getDefault(),
                            "Time remaining: %02d:%02d:%02d", hours, minutes, seconds);
                    timerTextView.setText(timeLeft);
                }
            }

            @Override
            public void onFinish() {
                if (!isFinishing()) {
                    isVotingDisabled = true;
                    votingAdapter.setVotingDisabled(true);
                    if (timerTextView != null) {
                        timerTextView.setText("Voting period has ended");
                    }
                    saveTimerExpiredState();
                    submitAllVotes();
                    showToast("Voting period has ended");
                }
            }
        }.start();
    }

    private void fetchVoterConstituency() {
        db.collection("voters")
                .whereEqualTo("nic", voterNIC)
                .get()
                .addOnSuccessListener(queryDocumentSnapshots -> {
                    if (!queryDocumentSnapshots.isEmpty()) {
                        DocumentSnapshot document = queryDocumentSnapshots.getDocuments().get(0);
                        voterConstituency = document.getString("constituency");
                        // Now that we have the constituency, get matching candidates
                        getCandidatesFromFirestore();
                    } else {
                        Log.e(TAG, "No voter found with NIC: " + voterNIC);
                        showToast("Error: Voter not found");
                        finish();
                    }
                })
                .addOnFailureListener(e -> {
                    Log.e(TAG, "Error fetching voter data: ", e);
                    showToast("Error: Unable to verify voter information");
                    finish();
                });
    }

    private void getCandidatesFromFirestore() {
        if (TextUtils.isEmpty(electionName)) {
            Log.e(TAG, "Election name is empty");
            showToast("Error: Invalid election data");
            return;
        }

        if (TextUtils.isEmpty(voterConstituency)) {
            Log.e(TAG, "Voter constituency is empty");
            showToast("Error: Unable to determine your constituency");
            return;
        }

        db.collection("candidates")
                .whereEqualTo("electionName", electionName)
                .whereEqualTo("constituency", voterConstituency) // Only get candidates from same constituency
                .get()
                .addOnSuccessListener(queryDocumentSnapshots -> {
                    candidateList.clear();
                    for (DocumentSnapshot document : queryDocumentSnapshots) {
                        try {
                            String candidateId = document.getString("candidateId");
                            String candidateName = document.getString("candidateName");
                            String candidateParty = document.getString("candidateParty");
                            String constituency = document.getString("constituency");
                            String district = document.getString("district");
                            String candidatePhotoBase64 = document.getString("candidatePhotoBase64");
                            String partySymbolBase64 = document.getString("partySymbolBase64");

                            if (!TextUtils.isEmpty(candidateId) && !TextUtils.isEmpty(candidateName)) {
                                Candidate candidate = new Candidate(candidateId, candidateName, candidateParty);
                                candidate.setElectionName(electionName);
                                candidate.setConstituency(constituency);
                                candidate.setDistrict(district);
                                candidate.setCandidatePhotoBase64(candidatePhotoBase64);
                                candidate.setPartySymbolBase64(partySymbolBase64);

                                // Mark candidate as already voted if in previously voted list
                                if (previouslyVotedCandidates.contains(candidateId)) {
                                    candidate.setVoted(true);
                                }

                                candidateList.add(candidate);
                            }
                        } catch (Exception e) {
                            Log.e(TAG, "Error parsing candidate: ", e);
                        }
                    }
                    votingAdapter.notifyDataSetChanged();

                    if (candidateList.isEmpty()) {
                        showToast("No candidates found for your constituency");
                    }
                })
                .addOnFailureListener(e -> {
                    Log.e(TAG, "Error fetching candidates: ", e);
                    showToast("Error loading candidates");
                });
    }



    @Override
    public void onVoteButtonClicked(Candidate candidate, int remainingVotes) {
        try {
            Calendar now = Calendar.getInstance();
            int currentHour = now.get(Calendar.HOUR_OF_DAY);

            if (currentHour < START_HOUR || currentHour >= END_HOUR) {
                showToast("Voting is only allowed between 9:00 AM and 4:00 PM");
                return;
            }

            if (isVotingDisabled) {
                showToast("Voting has ended");
                return;
            }

            // Special case for final vote notification
            if (candidate == null && remainingVotes == 0) {
                // This is our signal that the last vote was used
                getVotesUsedFromFirestore(votesUsed -> {
                    if (votesUsed >= MAX_VOTES) {
                        runOnUiThread(() -> {
                            onVotingCompleted(); // Now safely call the completion method
                        });
                    }
                });
                return;
            }

            if (candidate == null || TextUtils.isEmpty(candidate.getCandidateId())) {
                showToast("Invalid candidate selection");
                return;
            }

            // Check if candidate was already voted for
            if (previouslyVotedCandidates.contains(candidate.getCandidateId())) {
                showToast("You have already voted for " + candidate.getCandidateName());
                return;
            }

            // Check remaining votes directly from Firestore
            getVotesUsedFromFirestore(votesUsed -> {
                try {
                    if (votesUsed >= MAX_VOTES) {
                        showToast("You have used all your available votes");
                        // Update UI to reflect this
                        runOnUiThread(() -> {
                            isVotingDisabled = true;
                            votingAdapter.setVotingDisabled(true);
                            votesRemainingTextView.setText("Votes Remaining: 0");
                            timerTextView.setText("All votes have been cast");
                            saveVoteState();
                        });
                        return;
                    }
                            votesRemainingTextView.setText("Votes Remaining: 0");
                    // If we have votes remaining, save this vote
                    saveIndividualVote(candidate);
                } catch (Exception e) {
                    Log.e(TAG, "Error in vote button click handler: ", e);
                    showToast("Error processing your vote");
                }
            });
        } catch (Exception e) {
            Log.e(TAG, "Error in vote button click: ", e);
            showToast("An error occurred while processing your vote");
        }
    }

    private void saveIndividualVote(Candidate candidate) {
        try {
            // Create a more detailed vote result document with all candidate information
            VoteResult voteResult = new VoteResult(
                    voterNIC,
                    electionName,
                    candidate.getCandidateId(),
                    candidate.getCandidateName(),
                    electionDateString
            );

            // Add additional candidate details
            voteResult.setCandidateParty(candidate.getCandidateParty());
            voteResult.setConstituency(candidate.getConstituency());
            voteResult.setDistrict(candidate.getDistrict());
            voteResult.setCandidatePhotoBase64(candidate.getCandidatePhotoBase64());
            voteResult.setPartySymbolBase64(candidate.getPartySymbolBase64());

            // Add current timestamp
            voteResult.setTimestamp(System.currentTimeMillis());

            db.collection("results").add(voteResult)
                    .addOnSuccessListener(documentReference -> {
                        try {
                            // Add to local tracking
                            previouslyVotedCandidates.add(candidate.getCandidateId());

                            // Update the UI
                            runOnUiThread(() -> {
                                try {
                                    candidate.setVoted(true);
                                    votingAdapter.notifyDataSetChanged();

                                    // Show confirmation toast
                                    showToast("Vote registered for " + candidate.getCandidateName());

                                    // Update votes remaining display
                                    updateVotesRemainingDisplay();

                                    // Check if all votes have been cast
                                    getVotesUsedFromFirestore(votesUsed -> {
                                        if (votesUsed >= MAX_VOTES) {
                                            runOnUiThread(() -> {
                                                showToast("All votes have been cast!");
                                                isVotingDisabled = true;
                                                votingAdapter.setVotingDisabled(true);
                                                timerTextView.setText("All votes have been cast");
                                                saveVoteState();
                                            });
                                        }
                                    });
                                } catch (Exception e) {
                                    Log.e(TAG, "Error updating UI after vote: ", e);
                                }
                            });
                        } catch (Exception e) {
                            Log.e(TAG, "Error processing vote result: ", e);
                        }
                    })
                    .addOnFailureListener(e -> {
                        Log.e(TAG, "Error saving vote: ", e);
                        showToast("Error: Unable to save your vote");
                    });
        } catch (Exception e) {
            Log.e(TAG, "Error creating vote: ", e);
            showToast("Error: Unable to process your vote");
        }
    }



    @Override
    public void onVotingCompleted() {
        try {
            // This method is called when a user has used all their votes
            isVotingDisabled = true;
            votingAdapter.setVotingDisabled(true);
            saveVoteState();

            // Show a dialog instead of immediately closing
            new AlertDialog.Builder(this)
                    .setTitle("Voting Complete")
                    .setMessage("You have used all your votes. Would you like to view your votes or return to the main menu?")
                    .setPositiveButton("View Votes", (dialog, which) -> {
                        // You can implement a method to show the votes if needed
                        // For now, just stay on the current screen
                        timerTextView.setText("All votes have been cast");
                    })
                    .setNegativeButton("Main Menu", (dialog, which) -> {
                        // Return to main menu with a proper finish (not crashing)
                        finish();
                    })
                    .setCancelable(false)
                    .show();
        } catch (Exception e) {
            Log.e(TAG, "Error in onVotingCompleted: ", e);
            showToast("Error completing voting session");
        }
    }


    private void submitAllVotes() {
        // This method is now only for submitting any pending votes
        // when the timer expires, as we're now saving votes individually

        // Update our local tracking of voted candidates first
        loadVotedCandidatesFromFirestore();

        WriteBatch batch = db.batch();
        final boolean[] anySubmitted = {false};

        for (String candidateId : votingAdapter.getVotedCandidateIds()) {
                // Skip already submitted votes
                if (previouslyVotedCandidates.contains(candidateId)) {
                    continue;
                }

                // Find the candidate
                Candidate candidate = null;
                for (Candidate c : candidateList) {
                    if (c.getCandidateId().equals(candidateId)) {
                        candidate = c;
                        break;
                    }
                }

                if (candidate != null) {
                    // Need final for lambda
                    final Candidate finalCandidate = candidate;

                    VoteResult voteResult = new VoteResult(
                            voterNIC,
                            electionName,
                            finalCandidate.getCandidateId(),
                            finalCandidate.getCandidateName(),
                            electionDateString
                    );

                    // Add all candidate details
                    voteResult.setCandidateParty(finalCandidate.getCandidateParty());
                    voteResult.setConstituency(finalCandidate.getConstituency());
                    voteResult.setDistrict(finalCandidate.getDistrict());
                    voteResult.setCandidatePhotoBase64(finalCandidate.getCandidatePhotoBase64());
                    voteResult.setPartySymbolBase64(finalCandidate.getPartySymbolBase64());
                    voteResult.setTimestamp(System.currentTimeMillis());

                    batch.set(db.collection("results").document(), voteResult);
                    anySubmitted[0] = true;
                }
            }

            if (anySubmitted[0]) {
                batch.commit()
                        .addOnSuccessListener(aVoid -> {
                            loadVotedCandidatesFromFirestore(); // Refresh from server
                            saveVoteState();
                            showToast("Remaining votes have been submitted");
                        })
                        .addOnFailureListener(e -> {
                            Log.e(TAG, "Error submitting remaining votes: ", e);
                            showToast("Error submitting remaining votes");
                        });
            }
    }

    private void saveVoteState() {
        try {
            SharedPreferences sharedPreferences = getSharedPreferences(ELECTION_APP_PREFS, MODE_PRIVATE);
            SharedPreferences.Editor editor = sharedPreferences.edit();
            editor.putBoolean(VOTED_KEY + "_" + voterNIC + "_" + electionName, true);
            editor.apply();
        } catch (Exception e) {
            Log.e(TAG, "Error saving vote state: ", e);
        }
    }

    private void saveTimerExpiredState() {
        try {
            SharedPreferences sharedPreferences = getSharedPreferences(ELECTION_APP_PREFS, MODE_PRIVATE);
            SharedPreferences.Editor editor = sharedPreferences.edit();
            editor.putBoolean(TIMER_EXPIRED_KEY + "_" + voterNIC + "_" + electionName, true);
            editor.apply();
        } catch (Exception e) {
            Log.e(TAG, "Error saving timer state: ", e);
        }
    }

    private void showToast(final String message) {
        try {
            if (!isFinishing()) {
                runOnUiThread(() -> {
                    try {
                        new AlertDialog.Builder(VotingActivity.this)
                                .setMessage(message)
                                .setPositiveButton("OK", null)
                                .show();
                    } catch (Exception e) {
                        Log.e(TAG, "Error showing dialog: ", e);
                        // Fallback to standard toast
                        Toast.makeText(VotingActivity.this, message, Toast.LENGTH_SHORT).show();
                    }
                });
            }
        } catch (Exception e) {
            Log.e(TAG, "Error showing toast: ", e);
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (voteTimer != null) {
            voteTimer.cancel();
        }
    }
    @Override
    protected void onPause() {
        super.onPause();
        // Cancel any pending operations
        if (voteTimer != null) {
            voteTimer.cancel();
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        // Refresh the UI state
        if (!isFinishing()) {
            new Handler().post(this::updateVotesRemainingDisplay);
        }
    }
}