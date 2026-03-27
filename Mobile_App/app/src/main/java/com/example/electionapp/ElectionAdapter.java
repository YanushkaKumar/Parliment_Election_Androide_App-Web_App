package com.example.electionapp;

import android.content.Context;
import android.content.Intent;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.google.firebase.firestore.FirebaseFirestore;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.Locale;

public class ElectionAdapter extends RecyclerView.Adapter<ElectionAdapter.ElectionViewHolder> {
    private List<Election> electionList;
    private OnElectionClickListener clickListener;

    public ElectionAdapter(List<Election> electionList, OnElectionClickListener clickListener) {
        this.electionList = electionList;
        this.clickListener = clickListener;
    }

    @Override
    public ElectionViewHolder onCreateViewHolder(ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_election, parent, false);
        return new ElectionViewHolder(view);
    }

    @Override
    public void onBindViewHolder(ElectionViewHolder holder, int position) {
        Election election = electionList.get(position);
        holder.textViewElectionName.setText(election.getName());
        holder.textViewElectionDate.setText(election.getDate());

        // Check if this is a future election
        boolean isFutureElection = isElectionInFuture(election.getDate());

        // Set the card's clickability based on election status
        holder.itemView.setClickable(!isFutureElection);
        holder.itemView.setFocusable(!isFutureElection);

        // Optionally, change the appearance of future elections
        if (isFutureElection) {
            holder.itemView.setAlpha(0.5f); // Make future elections appear faded
            holder.itemView.setOnClickListener(v -> {
                Toast.makeText(v.getContext(), "This election has not been held yet",
                        Toast.LENGTH_SHORT).show();
            });
        } else {
            holder.itemView.setAlpha(1.0f);
            holder.itemView.setOnClickListener(v -> clickListener.onElectionClick(election));
        }
    }

    @Override
    public int getItemCount() {
        return electionList.size();
    }

    private boolean isElectionInFuture(String electionDateStr) {
        try {
            SimpleDateFormat dateFormat = new SimpleDateFormat("MM/dd/yy", Locale.getDefault());
            Date electionDate = dateFormat.parse(electionDateStr);
            Date currentDate = new Date();

            if (electionDate != null) {
                return electionDate.getTime() > currentDate.getTime();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }

    public static class ElectionViewHolder extends RecyclerView.ViewHolder {
        TextView textViewElectionName;
        TextView textViewElectionDate;

        public ElectionViewHolder(View itemView) {
            super(itemView);
            textViewElectionName = itemView.findViewById(R.id.electionItemName);
            textViewElectionDate = itemView.findViewById(R.id.electionItemDate);
        }
    }

    public interface OnElectionClickListener {
        void onElectionClick(Election election);
    }
}