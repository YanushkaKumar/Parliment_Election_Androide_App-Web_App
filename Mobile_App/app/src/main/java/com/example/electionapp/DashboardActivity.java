package com.example.electionapp;

import android.app.AlertDialog;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.cardview.widget.CardView;

import com.google.firebase.firestore.FirebaseFirestore;
import com.google.firebase.firestore.QueryDocumentSnapshot;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Locale;

public class DashboardActivity extends AppCompatActivity {

    private CardView cardViewAnalytics, cardViewLiveResults, cardViewResults, cardViewVoting;
    private FirebaseFirestore firestore;
    private List<Election> activeElections;
    private static final String TAG = "DashboardActivity";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_dashboard);

        initializeViews();
        setupClickListeners();
        loadActiveElections();
    }

    private void initializeViews() {
        cardViewAnalytics = findViewById(R.id.cardViewAnalytics);
        cardViewLiveResults = findViewById(R.id.cardViewLiveResults);
        cardViewResults = findViewById(R.id.cardViewResults);
        cardViewVoting = findViewById(R.id.cardViewVoting);

        firestore = FirebaseFirestore.getInstance();
        activeElections = new ArrayList<>();
    }

    private void setupClickListeners() {
        // Analytics - Show election selector or go to first active election
        cardViewAnalytics.setOnClickListener(v -> {
            if (activeElections != null && !activeElections.isEmpty()) {
                if (activeElections.size() == 1) {
                    // Go directly to analytics
                    Election election = activeElections.get(0);
                    Intent intent = new Intent(DashboardActivity.this, AnalyticsActivity.class);
                    intent.putExtra("ELECTION_NAME", election.getName());
                    intent.putExtra("ELECTION_DATE", election.getDate());
                    startActivity(intent);
                } else {
                    // Show election selector
                    showElectionSelector("Analytics", AnalyticsActivity.class);
                }
            } else {
                Toast.makeText(this, "No active elections available", Toast.LENGTH_SHORT).show();
            }
        });

        // Live Results - Show live results for active elections
        cardViewLiveResults.setOnClickListener(v -> {
            if (activeElections != null && !activeElections.isEmpty()) {
                if (activeElections.size() == 1) {
                    Election election = activeElections.get(0);
                    Intent intent = new Intent(DashboardActivity.this, LiveResultsActivity.class);
                    intent.putExtra("ELECTION_NAME", election.getName());
                    intent.putExtra("ELECTION_DATE", election.getDate());
                    startActivity(intent);
                } else {
                    showElectionSelector("Live Results", LiveResultsActivity.class);
                }
            } else {
                Toast.makeText(this, "No active elections available", Toast.LENGTH_SHORT).show();
            }
        });

        // Results - Show results for any election (active or completed)
        cardViewResults.setOnClickListener(v -> {
            if (activeElections != null && !activeElections.isEmpty()) {
                if (activeElections.size() == 1) {
                    Election election = activeElections.get(0);
                    Intent intent = new Intent(DashboardActivity.this, ResultActivity.class);
                    intent.putExtra("ELECTION_NAME", election.getName());
                    intent.putExtra("ELECTION_DATE", election.getDate());
                    startActivity(intent);
                } else {
                    showElectionSelector("Results", ResultActivity.class);
                }
            } else {
                Toast.makeText(this, "No elections available", Toast.LENGTH_SHORT).show();
            }
        });

        // Voting - Go to election home
        cardViewVoting.setOnClickListener(v -> {
            Intent intent = new Intent(DashboardActivity.this, ElectionHomeActivity.class);
            startActivity(intent);
        });
    }

    /**
     * Load all active elections (today or in the future)
     */
    private void loadActiveElections() {
        firestore.collection("elections")
            .get()
            .addOnSuccessListener(queryDocumentSnapshots -> {
                activeElections.clear();
                String todayDate = getTodayDate();

                for (QueryDocumentSnapshot document : queryDocumentSnapshots) {
                    String name = document.getString("name");
                    String date = document.getString("date");

                    if (name != null && date != null) {
                        // Check if election is today or in the future (active)
                        if (isActiveElection(date)) {
                            Election election = new Election(name, date);
                            activeElections.add(election);
                            Log.d(TAG, "Active election found: " + name + " on " + date);
                        }
                    }
                }

                Log.d(TAG, "Total active elections: " + activeElections.size());

                if (activeElections.isEmpty()) {
                    Toast.makeText(this, "No active elections found", Toast.LENGTH_SHORT).show();
                }
            })
            .addOnFailureListener(e -> {
                Log.e(TAG, "Error loading elections", e);
                Toast.makeText(this, "Error loading elections: " + e.getMessage(), Toast.LENGTH_SHORT).show();
            });
    }

    /**
     * Check if election date is today or in the future
     */
    private boolean isActiveElection(String electionDateStr) {
        try {
            SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault());
            Date electionDate = dateFormat.parse(electionDateStr);

            // Get today's date at midnight
            Calendar today = Calendar.getInstance();
            today.set(Calendar.HOUR_OF_DAY, 0);
            today.set(Calendar.MINUTE, 0);
            today.set(Calendar.SECOND, 0);
            today.set(Calendar.MILLISECOND, 0);

            if (electionDate != null) {
                // Election is active if it's today or in the future
                return !electionDate.before(today.getTime());
            }
        } catch (ParseException e) {
            Log.e(TAG, "Error parsing date: " + electionDateStr, e);
        }
        return false;
    }

    /**
     * Get today's date in yyyy-MM-dd format
     */
    private String getTodayDate() {
        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault());
        return dateFormat.format(new Date());
    }

    /**
     * Show dialog to select an election
     */
    private void showElectionSelector(String title, Class<?> targetActivity) {
        if (activeElections == null || activeElections.isEmpty()) {
            Toast.makeText(this, "No elections available", Toast.LENGTH_SHORT).show();
            return;
        }

        String[] electionNames = new String[activeElections.size()];
        for (int i = 0; i < activeElections.size(); i++) {
            electionNames[i] = activeElections.get(i).getName() + " - " + activeElections.get(i).getDate();
        }

        new AlertDialog.Builder(this)
            .setTitle("Select Election for " + title)
            .setItems(electionNames, (dialog, which) -> {
                Election selectedElection = activeElections.get(which);
                Intent intent = new Intent(DashboardActivity.this, targetActivity);
                intent.putExtra("ELECTION_NAME", selectedElection.getName());
                intent.putExtra("ELECTION_DATE", selectedElection.getDate());
                startActivity(intent);
            })
            .setNegativeButton("Cancel", null)
            .show();
    }
}

