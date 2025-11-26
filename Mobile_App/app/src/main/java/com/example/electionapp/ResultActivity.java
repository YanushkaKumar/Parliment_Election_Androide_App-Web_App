package com.example.electionapp;

import android.content.Intent;
import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.github.mikephil.charting.charts.PieChart;
import com.github.mikephil.charting.components.Legend;
import com.github.mikephil.charting.data.PieData;
import com.github.mikephil.charting.data.PieDataSet;
import com.github.mikephil.charting.data.PieEntry;
import com.github.mikephil.charting.formatter.PercentFormatter;
import com.github.mikephil.charting.utils.ColorTemplate;
import com.google.firebase.firestore.FirebaseFirestore;
import com.google.firebase.firestore.QueryDocumentSnapshot;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
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
    private PieChart pieChartQuickView;
    private Button btnViewAnalytics;

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
        pieChartQuickView = findViewById(R.id.pieChartQuickView);
        btnViewAnalytics = findViewById(R.id.btnViewAnalytics);

        // Initialize RecyclerView and Adapter
        recyclerView = findViewById(R.id.recyclerViewResults);
        recyclerView.setLayoutManager(new LinearLayoutManager(this));
        candidateResults = new ArrayList<>();
        allCandidateResults = new ArrayList<>();
        resultAdapter = new ElectionResultAdapter(candidateResults);
        recyclerView.setAdapter(resultAdapter);

        // Setup Analytics Button
        btnViewAnalytics.setOnClickListener(v -> {
            Intent intent = new Intent(ResultActivity.this, AnalyticsActivity.class);
            intent.putExtra("ELECTION_NAME", currentElectionName);
            intent.putExtra("ELECTION_DATE", currentElectionDate);
            startActivity(intent);
        });

        // Set up filter type spinner
        ArrayAdapter<String> filterTypeAdapter = new ArrayAdapter<>(this,
                android.R.layout.simple_spinner_item,
                new String[]{"All", "District", "Constituency"});
        filterTypeAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        spinnerFilterType.setAdapter(filterTypeAdapter);

        // Retrieve the election name and date passed from the previous activity
        currentElectionName = getIntent().getStringExtra("ELECTION_NAME");
        currentElectionDate = getIntent().getStringExtra("ELECTION_DATE");

        if (currentElectionName != null && currentElectionDate != null) {
            updateElectionTitle(currentElectionName, currentElectionDate);
            fetchElectionResults(currentElectionName, currentElectionDate);
        } else {
            fetchLatestElectionResults();
        }

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

    private void fetchElectionResults(String electionName, String electionDate) {
        // Map to count votes for each candidate
        Map<String, CandidateResult> candidateVotesMap = new HashMap<>();

        firestore.collection("results")
                .whereEqualTo("electionName", electionName)
                .whereEqualTo("electionDate", electionDate)
                .get()
                .addOnCompleteListener(task -> {
                    if (task.isSuccessful() && task.getResult() != null) {
                        for (QueryDocumentSnapshot document : task.getResult()) {
                            String candidateId = document.getString("candidateId");
                            String candidateName = document.getString("candidateName");
                            String candidateParty = document.getString("candidateParty");
                            String constituency = document.getString("constituency");
                            String district = document.getString("district");
                            String photoBase64 = document.getString("candidatePhotoBase64");
                            String partySymbolBase64 = document.getString("partySymbolBase64");

                            // Create a key for the candidate
                            String key = candidateId + "_" + candidateName;

                            if (candidateVotesMap.containsKey(key)) {
                                // Increment vote count for existing candidate
                                CandidateResult result = candidateVotesMap.get(key);
                                result.incrementVotes();
                            } else {
                                // Create new candidate result
                                CandidateResult result = new CandidateResult(
                                        candidateId,
                                        candidateName,
                                        candidateParty,
                                        constituency,
                                        district,
                                        photoBase64,
                                        partySymbolBase64,
                                        electionName,
                                        electionDate,
                                        1 // Initial vote count
                                );
                                candidateVotesMap.put(key, result);
                            }
                        }

                        // Convert map to list and update adapter
                        allCandidateResults.clear();
                        allCandidateResults.addAll(candidateVotesMap.values());

                        // Sort all results by vote count in descending order
                        Collections.sort(allCandidateResults, (c1, c2) ->
                                Integer.compare(c2.getVoteCount(), c1.getVoteCount()));

                        // Initialize with all results
                        candidateResults.clear();
                        candidateResults.addAll(allCandidateResults);
                        resultAdapter.notifyDataSetChanged();

                        // Update filter spinners with available options
                        updateFilterValueSpinner(spinnerFilterType.getSelectedItem().toString());

                        if (allCandidateResults.isEmpty()) {
                            textViewNoResults.setVisibility(View.VISIBLE);
                            recyclerView.setVisibility(View.GONE);
                            textViewNoResults.setText("No election results found");
                            pieChartQuickView.setVisibility(View.GONE);
                        } else {
                            textViewNoResults.setVisibility(View.GONE);
                            recyclerView.setVisibility(View.VISIBLE);
                            updatePieChart();
                        }
                    } else {
                        Toast.makeText(ResultActivity.this, "Error fetching election results", Toast.LENGTH_SHORT).show();
                        textViewNoResults.setVisibility(View.VISIBLE);
                        recyclerView.setVisibility(View.GONE);
                        textViewNoResults.setText("Error fetching election results");
                        pieChartQuickView.setVisibility(View.GONE);
                    }
                });
    }

    private void updatePieChart() {
        if (allCandidateResults.isEmpty()) {
            pieChartQuickView.setVisibility(View.GONE);
            return;
        }

        pieChartQuickView.setVisibility(View.VISIBLE);

        // Group votes by party
        Map<String, Integer> partyVotes = new HashMap<>();
        for (CandidateResult result : allCandidateResults) {
            String party = result.getCandidateParty();
            if (party != null && !party.isEmpty()) {
                partyVotes.put(party, partyVotes.getOrDefault(party, 0) + result.getVoteCount());
            }
        }

        // Create pie entries
        List<PieEntry> entries = new ArrayList<>();
        for (Map.Entry<String, Integer> entry : partyVotes.entrySet()) {
            if (entry.getValue() > 0) {
                entries.add(new PieEntry(entry.getValue(), entry.getKey()));
            }
        }

        if (entries.isEmpty()) {
            pieChartQuickView.setVisibility(View.GONE);
            return;
        }

        // Create dataset
        PieDataSet dataSet = new PieDataSet(entries, "Party Votes");
        dataSet.setColors(ColorTemplate.MATERIAL_COLORS);
        dataSet.setValueTextColor(Color.WHITE);
        dataSet.setValueTextSize(12f);
        dataSet.setSliceSpace(2f);
        dataSet.setSelectionShift(5f);

        // Create data
        PieData data = new PieData(dataSet);
        data.setValueFormatter(new PercentFormatter(pieChartQuickView));

        // Configure chart
        pieChartQuickView.setData(data);
        pieChartQuickView.setUsePercentValues(true);
        pieChartQuickView.getDescription().setEnabled(false);
        pieChartQuickView.setDrawHoleEnabled(true);
        pieChartQuickView.setHoleColor(Color.WHITE);
        pieChartQuickView.setTransparentCircleRadius(58f);
        pieChartQuickView.setDrawCenterText(true);
        pieChartQuickView.setCenterText("Party\nDistribution");
        pieChartQuickView.setCenterTextSize(14f);
        pieChartQuickView.setRotationEnabled(true);
        pieChartQuickView.setHighlightPerTapEnabled(true);

        // Configure legend
        Legend legend = pieChartQuickView.getLegend();
        legend.setVerticalAlignment(Legend.LegendVerticalAlignment.BOTTOM);
        legend.setHorizontalAlignment(Legend.LegendHorizontalAlignment.CENTER);
        legend.setOrientation(Legend.LegendOrientation.HORIZONTAL);
        legend.setDrawInside(false);
        legend.setWordWrapEnabled(true);

        pieChartQuickView.animateY(1000);
        pieChartQuickView.invalidate();
    }

    private void fetchLatestElectionResults() {
        // First get the most recent election
        firestore.collection("results")
                .orderBy("electionDate", com.google.firebase.firestore.Query.Direction.DESCENDING)
                .limit(1)
                .get()
                .addOnCompleteListener(task -> {
                    if (task.isSuccessful() && !task.getResult().isEmpty()) {
                        QueryDocumentSnapshot latestElection = (QueryDocumentSnapshot) task.getResult().getDocuments().get(0);
                        currentElectionName = latestElection.getString("electionName");
                        currentElectionDate = latestElection.getString("electionDate");

                        // Update the election title
                        updateElectionTitle(currentElectionName, currentElectionDate);

                        // Now fetch results for this election
                        fetchElectionResults(currentElectionName, currentElectionDate);
                    } else {
                        Toast.makeText(ResultActivity.this, "No elections found", Toast.LENGTH_SHORT).show();
                        textViewNoResults.setVisibility(View.VISIBLE);
                        recyclerView.setVisibility(View.GONE);
                        textViewNoResults.setText("No elections found");
                    }
                });
    }
}