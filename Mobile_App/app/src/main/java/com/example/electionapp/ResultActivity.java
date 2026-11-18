package com.example.electionapp;

import android.os.Bundle;
import android.view.View;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.google.firebase.firestore.FirebaseFirestore;
import com.google.firebase.firestore.QueryDocumentSnapshot;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class ResultActivity extends AppCompatActivity {

    private FirebaseFirestore firestore;
    private RecyclerView recyclerView;
    private ElectionResultAdapter resultAdapter;
    private List<CandidateResult> candidateResults;
    private List<CandidateResult> allCandidateResults; // To keep all results for filtering

    private Spinner spinnerFilterType;
    private Spinner spinnerFilterValue;
    private TextView textViewNoResults;
    private TextView textViewElectionTitle;

    private String currentElectionName;
    private String currentElectionDate;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_result);

        // Initialize Firebase Firestore
        firestore = FirebaseFirestore.getInstance();

        // Initialize UI components
        textViewNoResults = findViewById(R.id.textViewNoResults);
        textViewElectionTitle = findViewById(R.id.textViewElectionTitle);
        spinnerFilterType = findViewById(R.id.spinnerFilterType);
        spinnerFilterValue = findViewById(R.id.spinnerFilterValue);

        // Initialize RecyclerView and Adapter
        recyclerView = findViewById(R.id.recyclerViewResults);
        recyclerView.setLayoutManager(new LinearLayoutManager(this));
        candidateResults = new ArrayList<>();
        allCandidateResults = new ArrayList<>();
        resultAdapter = new ElectionResultAdapter(candidateResults);
        recyclerView.setAdapter(resultAdapter);

        // Set up filter type spinner
        ArrayAdapter<String> filterTypeAdapter = new ArrayAdapter<>(this,
                android.R.layout.simple_spinner_item,
                new String[]{"All", "District", "Constituency"});
        filterTypeAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        spinnerFilterType.setAdapter(filterTypeAdapter);

        // Retrieve the election name and date passed from the previous activity
        Election election = ElectionHomeActivity.getElection(getIntent());
        if (election == null) {
            finish();
            return;
        }
        currentElectionName = election.getName();
        currentElectionDate = election.getDate();
        updateElectionTitle(currentElectionName, currentElectionDate);
        fetchElectionResults(currentElectionName, currentElectionDate);

        // Set up spinner listeners
        spinnerFilterType.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
                String selectedFilterType = parent.getItemAtPosition(position).toString();
                updateFilterValueSpinner(selectedFilterType);
            }

            @Override
            public void onNothingSelected(AdapterView<?> parent) {
                // Do nothing
            }
        });

        spinnerFilterValue.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
                applyFilters();
            }

            @Override
            public void onNothingSelected(AdapterView<?> parent) {
                // Do nothing
            }
        });
    }

    private void updateElectionTitle(String electionName, String electionDate) {
        String titleText = electionName + " (" + electionDate + ")";
        textViewElectionTitle.setText(titleText);
    }

    private void updateFilterValueSpinner(String filterType) {
        if (allCandidateResults.isEmpty()) {
            return;
        }

        List<String> filterValues = new ArrayList<>();
        filterValues.add("All");

        Set<String> uniqueValues = new HashSet<>();

        if (filterType.equals("District")) {
            for (CandidateResult result : allCandidateResults) {
                if (result.getDistrict() != null && !result.getDistrict().isEmpty()) {
                    uniqueValues.add(result.getDistrict());
                }
            }
        } else if (filterType.equals("Constituency")) {
            for (CandidateResult result : allCandidateResults) {
                if (result.getConstituency() != null && !result.getConstituency().isEmpty()) {
                    uniqueValues.add(result.getConstituency());
                }
            }
        }

        filterValues.addAll(uniqueValues);

        ArrayAdapter<String> adapter = new ArrayAdapter<>(this,
                android.R.layout.simple_spinner_item, filterValues);
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        spinnerFilterValue.setAdapter(adapter);
    }

    private void applyFilters() {
        if (allCandidateResults.isEmpty()) {
            return;
        }

        String filterType = spinnerFilterType.getSelectedItem().toString();
        String filterValue = spinnerFilterValue.getSelectedItem().toString();

        candidateResults.clear();

        if (filterType.equals("All") || filterValue.equals("All")) {
            candidateResults.addAll(allCandidateResults);
        } else if (filterType.equals("District")) {
            for (CandidateResult result : allCandidateResults) {
                if (filterValue.equals(result.getDistrict())) {
                    candidateResults.add(result);
                }
            }
        } else if (filterType.equals("Constituency")) {
            for (CandidateResult result : allCandidateResults) {
                if (filterValue.equals(result.getConstituency())) {
                    candidateResults.add(result);
                }
            }
        }

        // Sort results by vote count in descending order
        sortResultsByVoteCount();

        resultAdapter.notifyDataSetChanged();

        // Show/hide no results message
        if (candidateResults.isEmpty()) {
            textViewNoResults.setVisibility(View.VISIBLE);
            recyclerView.setVisibility(View.GONE);
        } else {
            textViewNoResults.setVisibility(View.GONE);
            recyclerView.setVisibility(View.VISIBLE);
        }
    }

    // New method to sort results by vote count in descending order
    private void sortResultsByVoteCount() {
        Collections.sort(candidateResults, new Comparator<CandidateResult>() {
            @Override
            public int compare(CandidateResult c1, CandidateResult c2) {
                // For descending order, compare c2 to c1
                return Integer.compare(c2.getVoteCount(), c1.getVoteCount());
            }
        });
    }

    /**
     * Voters cannot read individual ballots, so results come from the per-candidate
     * "votes" counter that the castVote Cloud Function increments.
     */
    private void fetchElectionResults(String electionName, String electionDate) {
        firestore.collection("candidates")
                .whereEqualTo("electionName", electionName)
                .get()
                .addOnCompleteListener(task -> {
                    if (task.isSuccessful() && task.getResult() != null) {
                        allCandidateResults.clear();
                        for (QueryDocumentSnapshot document : task.getResult()) {
                            Candidate c = Candidate.fromDocument(document);
                            if (c == null) continue;
                            allCandidateResults.add(new CandidateResult(
                                    c.getCandidateId(),
                                    c.getCandidateName(),
                                    c.getCandidateParty(),
                                    c.getConstituency(),
                                    c.getDistrict(),
                                    c.getCandidatePhotoBase64(),
                                    c.getPartySymbolBase64(),
                                    electionName,
                                    electionDate,
                                    (int) c.getVotes()));
                        }

                        Collections.sort(allCandidateResults, (c1, c2) ->
                                Integer.compare(c2.getVoteCount(), c1.getVoteCount()));

                        candidateResults.clear();
                        candidateResults.addAll(allCandidateResults);
                        resultAdapter.notifyDataSetChanged();
                        updateFilterValueSpinner(spinnerFilterType.getSelectedItem().toString());

                        if (allCandidateResults.isEmpty()) {
                            textViewNoResults.setVisibility(View.VISIBLE);
                            recyclerView.setVisibility(View.GONE);
                            textViewNoResults.setText("No election results found");
                        } else {
                            textViewNoResults.setVisibility(View.GONE);
                            recyclerView.setVisibility(View.VISIBLE);
                        }
                    } else {
                        Toast.makeText(ResultActivity.this, "Error fetching election results", Toast.LENGTH_SHORT).show();
                        textViewNoResults.setVisibility(View.VISIBLE);
                        recyclerView.setVisibility(View.GONE);
                        textViewNoResults.setText("Error fetching election results");
                    }
                });
    }
}