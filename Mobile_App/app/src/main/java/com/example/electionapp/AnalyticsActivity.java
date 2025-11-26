package com.example.electionapp;

import android.graphics.Color;
import android.graphics.Typeface;
import android.os.Bundle;
import android.view.View;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.ProgressBar;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.cardview.widget.CardView;
import androidx.core.content.ContextCompat;

import com.github.mikephil.charting.charts.BarChart;
import com.github.mikephil.charting.charts.LineChart;
import com.github.mikephil.charting.charts.PieChart;
import com.github.mikephil.charting.charts.RadarChart;
import com.github.mikephil.charting.components.Description;
import com.github.mikephil.charting.components.Legend;
import com.github.mikephil.charting.components.XAxis;
import com.github.mikephil.charting.components.YAxis;
import com.github.mikephil.charting.data.BarData;
import com.github.mikephil.charting.data.BarDataSet;
import com.github.mikephil.charting.data.BarEntry;
import com.github.mikephil.charting.data.Entry;
import com.github.mikephil.charting.data.LineData;
import com.github.mikephil.charting.data.LineDataSet;
import com.github.mikephil.charting.data.PieData;
import com.github.mikephil.charting.data.PieDataSet;
import com.github.mikephil.charting.data.PieEntry;
import com.github.mikephil.charting.data.RadarData;
import com.github.mikephil.charting.data.RadarDataSet;
import com.github.mikephil.charting.data.RadarEntry;
import com.github.mikephil.charting.formatter.IndexAxisValueFormatter;
import com.github.mikephil.charting.formatter.PercentFormatter;
import com.github.mikephil.charting.utils.ColorTemplate;
import com.google.firebase.firestore.FirebaseFirestore;
import com.google.firebase.firestore.QueryDocumentSnapshot;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class AnalyticsActivity extends AppCompatActivity {

    private FirebaseFirestore firestore;
    private PieChart pieChartPartyDistribution;
    private BarChart barChartConstituencyWise;
    private LineChart lineChartVoteTrends;
    private RadarChart radarChartComparison;

    private TextView tvTotalVotes, tvTotalCandidates, tvLeadingParty, tvVoterTurnout;
    private TextView tvAnalyticsTitle;
    private ProgressBar progressBar;
    private Spinner spinnerElectionFilter;
    private CardView cardStats;

    private String currentElectionName;
    private String currentElectionDate;
    private List<CandidateResult> allResults;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_analytics);

        initializeViews();
        setupFirestore();
        retrieveIntentData();
        setupSpinner();

        if (currentElectionName != null && currentElectionDate != null) {
            loadElectionData();
        } else {
            loadLatestElectionData();
        }
    }

    private void initializeViews() {
        // Update to match new layout IDs
        pieChartPartyDistribution = findViewById(R.id.pieChart);
        barChartConstituencyWise = findViewById(R.id.barChart);
        lineChartVoteTrends = findViewById(R.id.lineChart);
        radarChartComparison = findViewById(R.id.radarChart);

        tvAnalyticsTitle = findViewById(R.id.tvAnalyticsTitle);

        // These views don't exist in new layout - set to null
        tvTotalVotes = null;
        tvTotalCandidates = null;
        tvLeadingParty = null;
        tvVoterTurnout = null;
        progressBar = null;
        spinnerElectionFilter = null;
        cardStats = null;

        allResults = new ArrayList<>();
    }

    private void setupFirestore() {
        firestore = FirebaseFirestore.getInstance();
    }

    private void retrieveIntentData() {
        currentElectionName = getIntent().getStringExtra("ELECTION_NAME");
        currentElectionDate = getIntent().getStringExtra("ELECTION_DATE");

        if (currentElectionName != null && currentElectionDate != null) {
            tvAnalyticsTitle.setText("Analytics: " + currentElectionName);
        }
    }

    private void setupSpinner() {
        List<String> filterOptions = new ArrayList<>();
        filterOptions.add("Overall Statistics");
        filterOptions.add("Party-wise Analysis");
        filterOptions.add("Constituency Analysis");
        filterOptions.add("Comparative Analysis");

        ArrayAdapter<String> adapter = new ArrayAdapter<>(this,
            android.R.layout.simple_spinner_item, filterOptions);
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        spinnerElectionFilter.setAdapter(adapter);

        spinnerElectionFilter.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
                updateChartsBasedOnFilter(position);
            }

            @Override
            public void onNothingSelected(AdapterView<?> parent) {}
        });
    }

    private void loadElectionData() {
        showLoading(true);

        firestore.collection("VoteResults")
            .whereEqualTo("electionName", currentElectionName)
            .whereEqualTo("electionDate", currentElectionDate)
            .get()
            .addOnSuccessListener(queryDocumentSnapshots -> {
                allResults.clear();

                for (QueryDocumentSnapshot document : queryDocumentSnapshots) {
                    String candidateId = document.getString("candidateId");
                    String candidateName = document.getString("candidateName");
                    String party = document.getString("candidateParty");
                    String constituency = document.getString("constituency");
                    String district = document.getString("district");
                    String photo = document.getString("photoBase64");
                    String symbol = document.getString("partySymbolBase64");
                    Long voteCount = document.getLong("voteCount");

                    if (voteCount == null) voteCount = 0L;

                    CandidateResult result = new CandidateResult(
                        candidateId, candidateName, party, constituency, district,
                        photo, symbol, currentElectionName, currentElectionDate,
                        voteCount.intValue()
                    );
                    allResults.add(result);
                }

                showLoading(false);
                processAndDisplayData();
            })
            .addOnFailureListener(e -> {
                showLoading(false);
                Toast.makeText(this, "Error loading data: " + e.getMessage(),
                    Toast.LENGTH_SHORT).show();
            });
    }

    private void loadLatestElectionData() {
        showLoading(true);

        firestore.collection("VoteResults")
            .get()
            .addOnSuccessListener(queryDocumentSnapshots -> {
                allResults.clear();

                for (QueryDocumentSnapshot document : queryDocumentSnapshots) {
                    String candidateId = document.getString("candidateId");
                    String candidateName = document.getString("candidateName");
                    String party = document.getString("candidateParty");
                    String constituency = document.getString("constituency");
                    String district = document.getString("district");
                    String photo = document.getString("photoBase64");
                    String symbol = document.getString("partySymbolBase64");
                    String electionName = document.getString("electionName");
                    String electionDate = document.getString("electionDate");
                    Long voteCount = document.getLong("voteCount");

                    if (voteCount == null) voteCount = 0L;

                    CandidateResult result = new CandidateResult(
                        candidateId, candidateName, party, constituency, district,
                        photo, symbol, electionName, electionDate,
                        voteCount.intValue()
                    );
                    allResults.add(result);
                }

                showLoading(false);
                processAndDisplayData();
            })
            .addOnFailureListener(e -> {
                showLoading(false);
                Toast.makeText(this, "Error loading data: " + e.getMessage(),
                    Toast.LENGTH_SHORT).show();
            });
    }

    private void processAndDisplayData() {
        if (allResults.isEmpty()) {
            Toast.makeText(this, "No data available", Toast.LENGTH_SHORT).show();
            return;
        }

        calculateStatistics();
        setupPieChart();
        setupBarChart();
        setupLineChart();
        setupRadarChart();
    }

    private void calculateStatistics() {
        int totalVotes = 0;
        int totalCandidates = allResults.size();
        Map<String, Integer> partyVotes = new HashMap<>();

        for (CandidateResult result : allResults) {
            totalVotes += result.getVoteCount();
            String party = result.getCandidateParty();
            partyVotes.put(party, partyVotes.getOrDefault(party, 0) + result.getVoteCount());
        }

        String leadingParty = "";
        int maxVotes = 0;
        for (Map.Entry<String, Integer> entry : partyVotes.entrySet()) {
            if (entry.getValue() > maxVotes) {
                maxVotes = entry.getValue();
                leadingParty = entry.getKey();
            }
        }

        tvTotalVotes.setText(String.valueOf(totalVotes));
        tvTotalCandidates.setText(String.valueOf(totalCandidates));
        tvLeadingParty.setText(leadingParty);

        // Calculate voter turnout (assuming registered voters - you can adjust this)
        int estimatedRegisteredVoters = totalVotes * 2; // Example calculation
        double turnoutPercentage = (totalVotes * 100.0) / estimatedRegisteredVoters;
        tvVoterTurnout.setText(String.format("%.1f%%", turnoutPercentage));
    }

    private void setupPieChart() {
        Map<String, Integer> partyVotes = new HashMap<>();

        for (CandidateResult result : allResults) {
            String party = result.getCandidateParty();
            partyVotes.put(party, partyVotes.getOrDefault(party, 0) + result.getVoteCount());
        }

        List<PieEntry> entries = new ArrayList<>();
        for (Map.Entry<String, Integer> entry : partyVotes.entrySet()) {
            entries.add(new PieEntry(entry.getValue(), entry.getKey()));
        }

        PieDataSet dataSet = new PieDataSet(entries, "Party Distribution");
        dataSet.setColors(ColorTemplate.MATERIAL_COLORS);
        dataSet.setValueTextColor(Color.WHITE);
        dataSet.setValueTextSize(14f);
        dataSet.setSliceSpace(3f);
        dataSet.setSelectionShift(8f);

        PieData data = new PieData(dataSet);
        data.setValueFormatter(new PercentFormatter(pieChartPartyDistribution));

        pieChartPartyDistribution.setData(data);
        pieChartPartyDistribution.setUsePercentValues(true);
        pieChartPartyDistribution.getDescription().setEnabled(false);
        pieChartPartyDistribution.setExtraOffsets(5, 10, 5, 5);
        pieChartPartyDistribution.setDragDecelerationFrictionCoef(0.95f);
        pieChartPartyDistribution.setDrawHoleEnabled(true);
        pieChartPartyDistribution.setHoleColor(Color.WHITE);
        pieChartPartyDistribution.setTransparentCircleRadius(61f);
        pieChartPartyDistribution.setDrawCenterText(true);
        pieChartPartyDistribution.setCenterText("Vote Share\nby Party");
        pieChartPartyDistribution.setCenterTextSize(16f);
        pieChartPartyDistribution.setRotationEnabled(true);
        pieChartPartyDistribution.setHighlightPerTapEnabled(true);

        Legend legend = pieChartPartyDistribution.getLegend();
        legend.setVerticalAlignment(Legend.LegendVerticalAlignment.TOP);
        legend.setHorizontalAlignment(Legend.LegendHorizontalAlignment.RIGHT);
        legend.setOrientation(Legend.LegendOrientation.VERTICAL);
        legend.setDrawInside(false);
        legend.setEnabled(true);

        pieChartPartyDistribution.animateY(1400);
        pieChartPartyDistribution.invalidate();
    }

    private void setupBarChart() {
        Map<String, Integer> constituencyVotes = new HashMap<>();

        for (CandidateResult result : allResults) {
            String constituency = result.getConstituency();
            if (constituency != null && !constituency.isEmpty()) {
                constituencyVotes.put(constituency,
                    constituencyVotes.getOrDefault(constituency, 0) + result.getVoteCount());
            }
        }

        List<BarEntry> entries = new ArrayList<>();
        List<String> labels = new ArrayList<>();
        int index = 0;

        for (Map.Entry<String, Integer> entry : constituencyVotes.entrySet()) {
            entries.add(new BarEntry(index++, entry.getValue()));
            labels.add(entry.getKey());
        }

        BarDataSet dataSet = new BarDataSet(entries, "Votes by Constituency");
        dataSet.setColors(ColorTemplate.COLORFUL_COLORS);
        dataSet.setValueTextColor(Color.BLACK);
        dataSet.setValueTextSize(12f);
        dataSet.setDrawValues(true);

        BarData data = new BarData(dataSet);
        data.setBarWidth(0.9f);

        barChartConstituencyWise.setData(data);
        barChartConstituencyWise.getDescription().setEnabled(false);
        barChartConstituencyWise.setFitBars(true);
        barChartConstituencyWise.animateY(1500);

        XAxis xAxis = barChartConstituencyWise.getXAxis();
        xAxis.setValueFormatter(new IndexAxisValueFormatter(labels));
        xAxis.setPosition(XAxis.XAxisPosition.BOTTOM);
        xAxis.setGranularity(1f);
        xAxis.setGranularityEnabled(true);
        xAxis.setLabelRotationAngle(-45);

        YAxis leftAxis = barChartConstituencyWise.getAxisLeft();
        leftAxis.setGranularity(1f);

        barChartConstituencyWise.getAxisRight().setEnabled(false);
        barChartConstituencyWise.invalidate();
    }

    private void setupLineChart() {
        // Simulating vote trends over time (you can modify this based on real data)
        List<Entry> entries = new ArrayList<>();

        // Sort candidates by vote count for trend visualization
        List<CandidateResult> sortedResults = new ArrayList<>(allResults);
        sortedResults.sort((a, b) -> Integer.compare(b.getVoteCount(), a.getVoteCount()));

        // Take top 10 candidates
        int limit = Math.min(10, sortedResults.size());
        for (int i = 0; i < limit; i++) {
            entries.add(new Entry(i, sortedResults.get(i).getVoteCount()));
        }

        LineDataSet dataSet = new LineDataSet(entries, "Top Candidates Performance");
        dataSet.setColor(ContextCompat.getColor(this, R.color.purple_500));
        dataSet.setCircleColor(ContextCompat.getColor(this, R.color.purple_700));
        dataSet.setLineWidth(3f);
        dataSet.setCircleRadius(5f);
        dataSet.setDrawCircleHole(true);
        dataSet.setValueTextSize(10f);
        dataSet.setDrawFilled(true);
        dataSet.setFillColor(ContextCompat.getColor(this, R.color.purple_200));
        dataSet.setMode(LineDataSet.Mode.CUBIC_BEZIER);
        dataSet.setCubicIntensity(0.2f);

        LineData data = new LineData(dataSet);

        lineChartVoteTrends.setData(data);
        lineChartVoteTrends.getDescription().setEnabled(false);
        lineChartVoteTrends.animateX(1500);
        lineChartVoteTrends.getXAxis().setPosition(XAxis.XAxisPosition.BOTTOM);
        lineChartVoteTrends.getAxisRight().setEnabled(false);
        lineChartVoteTrends.setTouchEnabled(true);
        lineChartVoteTrends.setDragEnabled(true);
        lineChartVoteTrends.setScaleEnabled(true);
        lineChartVoteTrends.setPinchZoom(true);

        lineChartVoteTrends.invalidate();
    }

    private void setupRadarChart() {
        // Top 5 parties comparison
        Map<String, Integer> partyVotes = new HashMap<>();

        for (CandidateResult result : allResults) {
            String party = result.getCandidateParty();
            partyVotes.put(party, partyVotes.getOrDefault(party, 0) + result.getVoteCount());
        }

        List<Map.Entry<String, Integer>> sortedParties = new ArrayList<>(partyVotes.entrySet());
        sortedParties.sort((a, b) -> b.getValue().compareTo(a.getValue()));

        List<RadarEntry> entries = new ArrayList<>();
        List<String> labels = new ArrayList<>();

        int limit = Math.min(5, sortedParties.size());
        for (int i = 0; i < limit; i++) {
            entries.add(new RadarEntry(sortedParties.get(i).getValue()));
            labels.add(sortedParties.get(i).getKey());
        }

        RadarDataSet dataSet = new RadarDataSet(entries, "Party Comparison");
        dataSet.setColor(ContextCompat.getColor(this, R.color.teal_700));
        dataSet.setFillColor(ContextCompat.getColor(this, R.color.teal_200));
        dataSet.setDrawFilled(true);
        dataSet.setFillAlpha(180);
        dataSet.setLineWidth(2f);
        dataSet.setDrawHighlightCircleEnabled(true);
        dataSet.setDrawHighlightIndicators(false);

        RadarData data = new RadarData(dataSet);
        data.setValueTextSize(10f);
        data.setDrawValues(false);

        radarChartComparison.setData(data);
        radarChartComparison.getDescription().setEnabled(false);
        radarChartComparison.setWebLineWidth(1.5f);
        radarChartComparison.setWebLineWidthInner(0.75f);
        radarChartComparison.setWebAlpha(100);

        XAxis xAxis = radarChartComparison.getXAxis();
        xAxis.setValueFormatter(new IndexAxisValueFormatter(labels));
        xAxis.setTextSize(12f);

        radarChartComparison.animateXY(1400, 1400);
        radarChartComparison.invalidate();
    }

    private void updateChartsBasedOnFilter(int filterPosition) {
        // You can implement different chart views based on filter selection
        switch (filterPosition) {
            case 0: // Overall Statistics
                pieChartPartyDistribution.setVisibility(View.VISIBLE);
                barChartConstituencyWise.setVisibility(View.VISIBLE);
                lineChartVoteTrends.setVisibility(View.VISIBLE);
                radarChartComparison.setVisibility(View.VISIBLE);
                break;
            case 1: // Party-wise Analysis
                pieChartPartyDistribution.setVisibility(View.VISIBLE);
                radarChartComparison.setVisibility(View.VISIBLE);
                barChartConstituencyWise.setVisibility(View.GONE);
                lineChartVoteTrends.setVisibility(View.GONE);
                break;
            case 2: // Constituency Analysis
                barChartConstituencyWise.setVisibility(View.VISIBLE);
                lineChartVoteTrends.setVisibility(View.VISIBLE);
                pieChartPartyDistribution.setVisibility(View.GONE);
                radarChartComparison.setVisibility(View.GONE);
                break;
            case 3: // Comparative Analysis
                radarChartComparison.setVisibility(View.VISIBLE);
                lineChartVoteTrends.setVisibility(View.VISIBLE);
                pieChartPartyDistribution.setVisibility(View.GONE);
                barChartConstituencyWise.setVisibility(View.GONE);
                break;
        }
    }

    private void showLoading(boolean show) {
        progressBar.setVisibility(show ? View.VISIBLE : View.GONE);
        cardStats.setVisibility(show ? View.GONE : View.VISIBLE);
    }
}

