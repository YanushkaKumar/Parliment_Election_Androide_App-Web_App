package com.example.electionapp;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.util.Base64;
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

        // Convert Base64 to images
        try {
            // Candidate Photo
            if (result.getPhotoBase64() != null && !result.getPhotoBase64().isEmpty()) {
                String base64Image = result.getPhotoBase64().split(",")[1];
                byte[] decodedString = Base64.decode(base64Image, Base64.DEFAULT);
                Bitmap bitmap = BitmapFactory.decodeByteArray(decodedString, 0, decodedString.length);
                holder.ivCandidatePhoto.setImageBitmap(bitmap);
            }

            // Party Symbol
            if (result.getPartySymbolBase64() != null && !result.getPartySymbolBase64().isEmpty()) {
                String base64Symbol = result.getPartySymbolBase64().split(",")[1];
                byte[] decodedString = Base64.decode(base64Symbol, Base64.DEFAULT);
                Bitmap bitmap = BitmapFactory.decodeByteArray(decodedString, 0, decodedString.length);
                holder.ivPartySymbol.setImageBitmap(bitmap);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
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