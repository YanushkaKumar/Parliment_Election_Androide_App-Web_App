package com.example.electionapp;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import java.util.List;

public class ElectionResultAdapter extends RecyclerView.Adapter<ElectionResultAdapter.ResultViewHolder> {
    private List<CandidateResult> candidateResults;

    public ElectionResultAdapter(List<CandidateResult> candidateResults) {
        this.candidateResults = candidateResults;
    }

    @NonNull
    @Override
    public ResultViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_election_result, parent, false);
        return new ResultViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ResultViewHolder holder, int position) {
        CandidateResult result = candidateResults.get(position);
        holder.tvCandidateName.setText(result.getCandidateName());
        holder.tvCandidateId.setText(result.getCandidateId());
        holder.tvCandidateParty.setText(result.getCandidateParty());
        holder.tvConstituency.setText(result.getConstituency());
        holder.tvDistrict.setText(result.getDistrict());
        holder.tvVoteCount.setText(String.valueOf(result.getVoteCount()));

        ImageUtils.bind(holder.ivCandidatePhoto, result.getPhotoBase64());
        ImageUtils.bind(holder.ivPartySymbol, result.getPartySymbolBase64());
    }

    @Override
    public int getItemCount() {
        return candidateResults.size();
    }

    static class ResultViewHolder extends RecyclerView.ViewHolder {
        ImageView ivCandidatePhoto, ivPartySymbol;
        TextView tvCandidateName, tvCandidateParty, tvConstituency, tvDistrict, tvVoteCount,tvCandidateId;

        public ResultViewHolder(@NonNull View itemView) {
            super(itemView);
            ivCandidatePhoto = itemView.findViewById(R.id.ivCandidatePhoto);
            tvCandidateId = itemView.findViewById(R.id.tvCandidateId);
            ivPartySymbol = itemView.findViewById(R.id.ivPartySymbol);
            tvCandidateName = itemView.findViewById(R.id.tvCandidateName);
            tvCandidateParty = itemView.findViewById(R.id.tvCandidateParty);
            tvConstituency = itemView.findViewById(R.id.tvConstituency);
            tvDistrict = itemView.findViewById(R.id.tvDistrict);
            tvVoteCount = itemView.findViewById(R.id.tvVoteCount);
        }
    }
}