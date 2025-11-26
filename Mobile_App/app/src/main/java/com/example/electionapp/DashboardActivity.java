package com.example.electionapp;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.cardview.widget.CardView;

import com.google.firebase.firestore.FirebaseFirestore;
import com.google.firebase.firestore.QueryDocumentSnapshot;

import java.util.ArrayList;
import java.util.List;

public class DashboardActivity extends AppCompatActivity {

    private CardView cardViewAnalytics, cardViewLiveResults, cardViewResults, cardViewVoting;
    private FirebaseFirestore firestore;
    private String electionName;
    private String electionDate;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_dashboard);

        initializeViews();
        setupClickListeners();
        loadLatestElection();
    }

    private void initializeViews() {
        cardViewAnalytics = findViewById(R.id.cardViewAnalytics);
        cardViewLiveResults = findViewById(R.id.cardViewLiveResults);
        cardViewResults = findViewById(R.id.cardViewResults);
        cardViewVoting = findViewById(R.id.cardViewVoting);

        firestore = FirebaseFirestore.getInstance();
    }

    private void setupClickListeners() {
        cardViewAnalytics.setOnClickListener(v -> {
            if (electionName != null && electionDate != null) {
                Intent intent = new Intent(DashboardActivity.this, AnalyticsActivity.class);
                intent.putExtra("ELECTION_NAME", electionName);
                intent.putExtra("ELECTION_DATE", electionDate);
                startActivity(intent);
            } else {
                Toast.makeText(this, "Loading election data...", Toast.LENGTH_SHORT).show();
            }
        });

        cardViewLiveResults.setOnClickListener(v -> {
            if (electionName != null && electionDate != null) {
                Intent intent = new Intent(DashboardActivity.this, LiveResultsActivity.class);
                intent.putExtra("ELECTION_NAME", electionName);
                intent.putExtra("ELECTION_DATE", electionDate);
                startActivity(intent);
            } else {
                Toast.makeText(this, "Loading election data...", Toast.LENGTH_SHORT).show();
            }
        });

        cardViewResults.setOnClickListener(v -> {
            if (electionName != null && electionDate != null) {
                Intent intent = new Intent(DashboardActivity.this, ResultActivity.class);
                intent.putExtra("ELECTION_NAME", electionName);
                intent.putExtra("ELECTION_DATE", electionDate);
                startActivity(intent);
            } else {
                Toast.makeText(this, "Loading election data...", Toast.LENGTH_SHORT).show();
            }
        });

        cardViewVoting.setOnClickListener(v -> {
            Intent intent = new Intent(DashboardActivity.this, ElectionHomeActivity.class);
            startActivity(intent);
        });
    }

    private void loadLatestElection() {
        firestore.collection("results")
            .orderBy("electionDate", com.google.firebase.firestore.Query.Direction.DESCENDING)
            .limit(1)
            .get()
            .addOnSuccessListener(queryDocumentSnapshots -> {
                if (!queryDocumentSnapshots.isEmpty()) {
                    QueryDocumentSnapshot document = (QueryDocumentSnapshot) queryDocumentSnapshots.getDocuments().get(0);
                    electionName = document.getString("electionName");
                    electionDate = document.getString("electionDate");
                }
            })
            .addOnFailureListener(e -> {
                Toast.makeText(this, "Error loading election data", Toast.LENGTH_SHORT).show();
            });
    }
}

