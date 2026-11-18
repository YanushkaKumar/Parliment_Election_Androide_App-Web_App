package com.example.electionapp;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import java.util.List;

public class ElectionAdapter extends RecyclerView.Adapter<ElectionAdapter.ElectionViewHolder> {

    public interface OnElectionClickListener {
        void onElectionClick(Election election);
    }

    private final List<Election> electionList;
    private final OnElectionClickListener clickListener;

    public ElectionAdapter(List<Election> electionList, OnElectionClickListener clickListener) {
        this.electionList = electionList;
        this.clickListener = clickListener;
    }

    @NonNull
    @Override
    public ElectionViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_election, parent, false);
        return new ElectionViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ElectionViewHolder holder, int position) {
        Election election = electionList.get(position);
        holder.name.setText(election.getName());

        String label;
        switch (ElectionTime.status(election)) {
            case OPEN:
                label = "Voting open until " + election.getEndTime();
                break;
            case UPCOMING:
                label = election.getDate() + " · opens " + election.getStartTime();
                break;
            case CLOSED:
                label = election.getDate() + " · closed";
                break;
            default:
                label = election.getDate();
        }
        holder.date.setText(label);
        // Elections that have not started yet are shown faded.
        holder.itemView.setAlpha(ElectionTime.status(election) == ElectionTime.Status.UPCOMING ? 0.5f : 1f);
        holder.itemView.setOnClickListener(v -> clickListener.onElectionClick(election));
    }

    @Override
    public int getItemCount() {
        return electionList.size();
    }

    static class ElectionViewHolder extends RecyclerView.ViewHolder {
        final TextView name;
        final TextView date;

        ElectionViewHolder(View itemView) {
            super(itemView);
            name = itemView.findViewById(R.id.tvElectionItemName);
            date = itemView.findViewById(R.id.tvElectionItemDate);
        }
    }
}
