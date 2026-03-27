package com.example.electionapp;

import android.graphics.Color;
import android.os.Bundle;
import android.os.Handler;
import android.view.View;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.cardview.widget.CardView;
import androidx.core.content.ContextCompat;

import com.facebook.shimmer.ShimmerFrameLayout;
import com.github.mikephil.charting.charts.BarChart;
import com.github.mikephil.charting.charts.HorizontalBarChart;
import com.github.mikephil.charting.charts.LineChart;
import com.github.mikephil.charting.components.XAxis;
import com.github.mikephil.charting.components.YAxis;
import com.github.mikephil.charting.data.BarData;
import com.github.mikephil.charting.data.BarDataSet;
import com.github.mikephil.charting.data.BarEntry;
import com.github.mikephil.charting.data.Entry;
import com.github.mikephil.charting.data.LineData;
import com.github.mikephil.charting.data.LineDataSet;
import com.github.mikephil.charting.formatter.IndexAxisValueFormatter;
import com.github.mikephil.charting.utils.ColorTemplate;
import com.google.firebase.firestore.DocumentChange;
import com.google.firebase.firestore.FirebaseFirestore;
import com.google.firebase.firestore.ListenerRegistration;
import com.google.firebase.firestore.QueryDocumentSnapshot;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class LiveResultsActivity extends AppCompatActivity {

    private FirebaseFirestore firestore;
    private HorizontalBarChart horizontalBarChart;
    private LineChart lineChartLiveUpdates;
    private TextView tvLiveVoteCount, tvLastUpdate, tvTrendingParty;
    private ShimmerFrameLayout shimmerLayout;
    private CardView cardLiveStats;

    private String electionName;
    private String electionDate;
    private ListenerRegistration votesListener;

    private Map<String, Integer> partyVoteCounts = new HashMap<>();
    private List<Integer> voteHistory = new ArrayList<>();
    private Handler updateHandler = new Handler();
    private int totalVotes = 0;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_live_results);

        initializeViews();
        retrieveIntentData();
        setupFirestoreListener();
    }

    private void initializeViews() {
        horizontalBarChart = findViewById(R.id.horizontalBarChartLive);
        lineChartLiveUpdates = findViewById(R.id.lineChartLiveUpdates);
        tvLiveVoteCount = findViewById(R.id.tvLiveVoteCount);
        tvLastUpdate = findViewById(R.id.tvLastUpdate);
        tvTrendingParty = findViewById(R.id.tvTrendingParty);
        shimmerLayout = findViewById(R.id.shimmerLayout);
        cardLiveStats = findViewById(R.id.cardLiveStats);

        firestore = FirebaseFirestore.getInstance();
    }

    private void retrieveIntentData() {
        electionName = getIntent().getStringExtra("ELECTION_NAME");
        electionDate = getIntent().getStringExtra("ELECTION_DATE");

        if (electionName == null || electionDate == null) {
            Toast.makeText(this, "Election data not found", Toast.LENGTH_SHORT).show();
            finish();
        }
    }

    private void setupFirestoreListener() {
        showShimmer(true);

        // Real-time listener for vote results
        votesListener = firestore.collection("results")
            .whereEqualTo("electionName", electionName)
            .whereEqualTo("electionDate", electionDate)
            .addSnapshotListener((snapshots, error) -> {
                if (error != null) {
                    Toast.makeText(this, "Error listening to updates: " + error.getMessage(),
                        Toast.LENGTH_SHORT).show();
                    showShimmer(false);
                    return;
                }

                if (snapshots != null) {
                    processVoteUpdates(snapshots.getDocumentChanges());
                    showShimmer(false);
                }
            });
    }

    private void processVoteUpdates(List<DocumentChange> changes) {
        boolean hasChanges = false;

        for (DocumentChange dc : changes) {
            hasChanges = true;
            QueryDocumentSnapshot document = dc.getDocument();

            String party = document.getString("candidateParty");
            if (party != null) {
                partyVoteCounts.put(party, partyVoteCounts.getOrDefault(party, 0) + 1);
                totalVotes++;
            }
        }

        if (hasChanges) {
            voteHistory.add(totalVotes);
            updateAllCharts();
            updateStatistics();
            animateUpdate();
        }
    }

    private void updateAllCharts() {
        updateHorizontalBarChart();
        updateLineChart();
    }

    private void updateHorizontalBarChart() {
        List<BarEntry> entries = new ArrayList<>();
        List<String> labels = new ArrayList<>();

        int index = 0;
        for (Map.Entry<String, Integer> entry : partyVoteCounts.entrySet()) {
            entries.add(new BarEntry(index, entry.getValue()));
            labels.add(entry.getKey());
            index++;
        }

        BarDataSet dataSet = new BarDataSet(entries, "Live Vote Count");
        dataSet.setColors(ColorTemplate.MATERIAL_COLORS);
        dataSet.setValueTextColor(Color.BLACK);
        dataSet.setValueTextSize(14f);
        dataSet.setDrawValues(true);

        BarData data = new BarData(dataSet);
        data.setBarWidth(0.8f);

        horizontalBarChart.setData(data);
        horizontalBarChart.getDescription().setEnabled(false);
        horizontalBarChart.setFitBars(true);
        horizontalBarChart.setDrawValueAboveBar(true);
        horizontalBarChart.setTouchEnabled(true);
        horizontalBarChart.setDragEnabled(true);
        horizontalBarChart.setScaleEnabled(true);

        YAxis leftAxis = horizontalBarChart.getAxisLeft();
        leftAxis.setValueFormatter(new IndexAxisValueFormatter(labels));
        leftAxis.setGranularity(1f);

        XAxis xAxis = horizontalBarChart.getXAxis();
        xAxis.setPosition(XAxis.XAxisPosition.BOTTOM);
        xAxis.setGranularity(1f);

        horizontalBarChart.getAxisRight().setEnabled(false);
        horizontalBarChart.animateY(800);
        horizontalBarChart.invalidate();
    }

    private void updateLineChart() {
        List<Entry> entries = new ArrayList<>();

        for (int i = 0; i < voteHistory.size(); i++) {
            entries.add(new Entry(i, voteHistory.get(i)));
        }

        LineDataSet dataSet = new LineDataSet(entries, "Vote Progression");
        dataSet.setColor(ContextCompat.getColor(this, R.color.purple_500));
        dataSet.setCircleColor(ContextCompat.getColor(this, R.color.purple_700));
        dataSet.setLineWidth(3f);
        dataSet.setCircleRadius(4f);
        dataSet.setDrawCircleHole(false);
        dataSet.setValueTextSize(10f);
        dataSet.setDrawFilled(true);
        dataSet.setFillColor(ContextCompat.getColor(this, R.color.purple_200));
        dataSet.setMode(LineDataSet.Mode.CUBIC_BEZIER);
        dataSet.setCubicIntensity(0.2f);
        dataSet.setDrawValues(false);

        LineData data = new LineData(dataSet);

        lineChartLiveUpdates.setData(data);
        lineChartLiveUpdates.getDescription().setEnabled(false);
        lineChartLiveUpdates.getXAxis().setPosition(XAxis.XAxisPosition.BOTTOM);
        lineChartLiveUpdates.getAxisRight().setEnabled(false);
        lineChartLiveUpdates.setTouchEnabled(true);
        lineChartLiveUpdates.setDragEnabled(true);
        lineChartLiveUpdates.setScaleEnabled(true);
        lineChartLiveUpdates.setPinchZoom(true);
        lineChartLiveUpdates.animateX(500);
        lineChartLiveUpdates.invalidate();
    }

    private void updateStatistics() {
        tvLiveVoteCount.setText(String.valueOf(totalVotes));
        tvLastUpdate.setText("Updated just now");

        // Find trending party
        String trendingParty = "";
        int maxVotes = 0;
        for (Map.Entry<String, Integer> entry : partyVoteCounts.entrySet()) {
            if (entry.getValue() > maxVotes) {
                maxVotes = entry.getValue();
                trendingParty = entry.getKey();
            }
        }
        tvTrendingParty.setText(trendingParty);
    }

    private void animateUpdate() {
        // Pulse animation for live updates
        cardLiveStats.animate()
            .scaleX(1.05f)
            .scaleY(1.05f)
            .setDuration(200)
            .withEndAction(() -> {
                cardLiveStats.animate()
                    .scaleX(1.0f)
                    .scaleY(1.0f)
                    .setDuration(200)
                    .start();
            })
            .start();
    }

    private void showShimmer(boolean show) {
        if (show) {
            shimmerLayout.setVisibility(View.VISIBLE);
            shimmerLayout.startShimmer();
            cardLiveStats.setVisibility(View.GONE);
        } else {
            shimmerLayout.stopShimmer();
            shimmerLayout.setVisibility(View.GONE);
            cardLiveStats.setVisibility(View.VISIBLE);
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (votesListener != null) {
            votesListener.remove();
        }
        updateHandler.removeCallbacksAndMessages(null);
    }
}

