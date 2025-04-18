package com.example.electionapp;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.util.Log;
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

import com.google.firebase.firestore.FirebaseFirestore;

import jp.wasabeef.blurry.Blurry;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Locale;

public class ElectionHomeActivity extends AppCompatActivity {

    private FirebaseFirestore db;
    private RecyclerView recyclerView;
    private ElectionAdapter electionAdapter;
    private List<Election> electionList;
    private TextView textViewGreeting;
    private ViewGroup rootLayout;


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_election_home);

        db = FirebaseFirestore.getInstance();
        recyclerView = findViewById(R.id.recyclerViewElections);
        recyclerView.setLayoutManager(new LinearLayoutManager(this));
        textViewGreeting = findViewById(R.id.textViewGreeting);
        rootLayout = findViewById(android.R.id.content);

        electionList = new ArrayList<>();
        electionAdapter = new ElectionAdapter(electionList, this::showElectionDialog);
        recyclerView.setAdapter(electionAdapter);

        // Retrieve NIC from SharedPreferences
        SharedPreferences sharedPreferences = getSharedPreferences("ElectionAppPrefs", MODE_PRIVATE);
        String nic = sharedPreferences.getString("NIC", null);

        if (nic == null) {
            nic = getIntent().getStringExtra("NIC"); // Fallback to intent data
            if (nic != null) {
                SharedPreferences.Editor editor = sharedPreferences.edit();
                editor.putString("NIC", nic);
                editor.apply();
            }
        }

        if (nic == null) {
            Toast.makeText(this, "NIC not found", Toast.LENGTH_SHORT).show();
        } else {
            Log.d("NIC_DEBUG", "Retrieved NIC: " + nic);
            getUserNameFromFirestore(nic);
            getElectionsFromFirestore();
        }
    }

    /**
     * Determines the election status: Future, Ongoing (within 24 hours), or Past.
     */
    private void showElectionDialog(Election election) {
        int electionStatus = getElectionStatus(election.getDate());
        Log.d("ELECTION_DEBUG", "Election: " + election.getName() +
                ", Date: " + election.getDate() +
                ", Status: " + electionStatus);

        if (electionStatus == 1) {
            // Future election - show toast and return immediately
            Toast.makeText(this, "This election has not been held yet", Toast.LENGTH_SHORT).show();
            return; // Exit the method without showing any dialog
        } else if (electionStatus == 0) {
            // Ongoing election, show regular dialog
            showElectionDialogDetails(election);
        } else {
            // Past election, show end election dialog
            showElectionEndDialog(election);
        }
    }

    /**
     * Determines the election status: Future (1), Ongoing (0), or Past (-1).
     */
    private int getElectionStatus(String electionDateStr) {
        try {
            // Update the format to match the database format "yyyy-MM-dd"
            SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault());
            Date electionDate = dateFormat.parse(electionDateStr);
            Date currentDate = new Date();

            if (electionDate != null) {
                // Convert both dates to yyyy-MM-dd format for comparison
                SimpleDateFormat justDateFormat = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault());
                String electionDateOnly = justDateFormat.format(electionDate);
                String currentDateOnly = justDateFormat.format(currentDate);

                // If dates match (same day), it's today's election
                if (electionDateOnly.equals(currentDateOnly)) {
                    return 0; // Today's election (ongoing)
                } else if (electionDate.after(currentDate)) {
                    return 1; // Future election
                } else {
                    return -1; // Past election
                }
            }
        } catch (Exception e) {
            Log.e("ELECTION_DEBUG", "Error parsing date: " + electionDateStr, e);
            e.printStackTrace();
        }
        return 1; // Default: assume future election if there's an error
    }

    private void showElectionDialogDetails(Election election) {
        // Inflate the regular election dialog layout
        View dialogView = LayoutInflater.from(this).inflate(R.layout.dialog_election, null);

        // Set the election title
        TextView electionTitleTextView = dialogView.findViewById(R.id.textViewElectionTitle);
        electionTitleTextView.setText(election.getName());

        // Buttons for voting and results
        Button voteButton123 = dialogView.findViewById(R.id.buttonVote123);
        Button resultButton = dialogView.findViewById(R.id.buttonResult);

        // Initially disable the vote button
        voteButton123.setEnabled(false);

        // Create and show the dialog
        AlertDialog dialog = new AlertDialog.Builder(this)
                .setView(dialogView)
                .setCancelable(true)
                .create();

        // Apply blur effect to the background
        Blurry.with(this).radius(6).sampling(4).async().onto(rootLayout);
        dialog.show();
        dialog.setOnDismissListener(d -> Blurry.delete(rootLayout));

        // Get the NIC ONLY from SharedPreferences
        SharedPreferences sharedPreferences = getSharedPreferences("ElectionAppPrefs", MODE_PRIVATE);
        String loggedInNIC = sharedPreferences.getString("NIC", null);

        if (loggedInNIC != null) {
            // Enable vote button and set up click listener with the verified NIC
            checkIfUserHasVoted(election.getName(), loggedInNIC, resultButton);
            voteButton123.setEnabled(true);

            // Set up vote button listener with the verified NIC only
            voteButton123.setOnClickListener(v -> {
                Intent intent = new Intent(ElectionHomeActivity.this, VotingActivity.class);
                intent.putExtra("ELECTION_NAME", election.getName());
                intent.putExtra("ELECTION_DATE", election.getDate());
                intent.putExtra("NIC", loggedInNIC); // Use only the SharedPreferences NIC
                Log.d("NIC_DEBUG", "Using verified NIC for voting: " + loggedInNIC);
                startActivity(intent);
                dialog.dismiss();
            });

            // Set up result button listener - ensure we pass both election name and date
            resultButton.setOnClickListener(v -> {
                navigateToResults(election.getName(), election.getDate());
                dialog.dismiss();
            });
        } else {
            Toast.makeText(this, "Please log in again", Toast.LENGTH_SHORT).show();
            Log.e("NIC_ERROR", "No logged in NIC found");
        }
    }

    /**
     * Checks if the user has voted for the election.
     */
    private void checkIfUserHasVoted(String electionName, String voterNIC, Button resultButton) {
        db.collection("results")
                .whereEqualTo("electionName", electionName)
                .whereEqualTo("voterNIC", voterNIC)
                .get()
                .addOnCompleteListener(task -> {
                    if (task.isSuccessful() && task.getResult() != null && task.getResult().size() >= 3) {
                        // The user has voted at least 3 times, enable the result button
                        resultButton.setEnabled(true);
                    } else {
                        // The user has not voted enough times, disable the result button
                        resultButton.setEnabled(false);
                    }
                });
    }

    /**
     * Create a centralized method to navigate to the ResultActivity
     * to ensure consistent behavior for both dialogs.
     */
    private void navigateToResults(String electionName, String electionDate) {
        Intent intent = new Intent(ElectionHomeActivity.this, ResultActivity.class);
        intent.putExtra("ELECTION_NAME", electionName);
        intent.putExtra("ELECTION_DATE", electionDate);
        Log.d("RESULT_DEBUG", "Navigating to results for election: " + electionName + ", date: " + electionDate);
        startActivity(intent);
    }

    private void showElectionEndDialog(Election election) {
        // Inflate the election end dialog layout
        View dialogView = LayoutInflater.from(this).inflate(R.layout.dialo_election_end, null);

        // Set election title
        TextView electionTitleTextView = dialogView.findViewById(R.id.textViewElectionEndTitle);
        electionTitleTextView.setText(election.getName());

        // Button to show the results
        Button resultButton = dialogView.findViewById(R.id.buttonelectionEndResult);

        AlertDialog dialog = new AlertDialog.Builder(this)
                .setView(dialogView)
                .setCancelable(true)
                .create();

        Blurry.with(this).radius(6).sampling(4).async().onto(rootLayout);
        dialog.show();
        dialog.setOnDismissListener(d -> Blurry.delete(rootLayout));

        // Use the centralized navigate method to ensure consistency
        resultButton.setOnClickListener(v -> {
            navigateToResults(election.getName(), election.getDate());
            dialog.dismiss();
        });
    }

    /**
     * Retrieves the user's name based on their NIC and displays a greeting.
     */
    private void getUserNameFromFirestore(String nic) {
        db.collection("voters")
                .whereEqualTo("nic", nic)
                .get()
                .addOnCompleteListener(task -> {
                    if (task.isSuccessful() && task.getResult() != null && !task.getResult().isEmpty()) {
                        String name = task.getResult().getDocuments().get(0).getString("name");
                        textViewGreeting.setText(name != null ? "Hello! " + name : "Hello, Voter!");
                    } else {
                        Toast.makeText(this, "NIC not found", Toast.LENGTH_SHORT).show();
                    }
                });
    }

    private void getElectionsFromFirestore() {
        db.collection("elections")
                .get()
                .addOnCompleteListener(task -> {
                    if (task.isSuccessful() && task.getResult() != null) {
                        for (com.google.firebase.firestore.DocumentSnapshot document : task.getResult().getDocuments()) {
                            String electionName = document.getString("name");
                            String electionDate = document.getString("date");

                            if (electionName != null && electionDate != null) {
                                electionList.add(new Election(electionName, electionDate));
                            }
                        }
                        electionAdapter.notifyDataSetChanged();
                    } else {
                        Toast.makeText(this, "Error fetching elections", Toast.LENGTH_SHORT).show();
                    }
                });
    }
}