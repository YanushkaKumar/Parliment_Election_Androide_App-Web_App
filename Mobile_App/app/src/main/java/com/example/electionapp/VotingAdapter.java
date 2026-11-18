package com.example.electionapp;

import android.annotation.SuppressLint;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import java.util.List;

/** Displays candidates; all voting rules are enforced by the castVote Cloud Function. */
public class VotingAdapter extends RecyclerView.Adapter<VotingAdapter.CandidateViewHolder> {

    public interface OnVoteClickListener {
        void onVoteClicked(Candidate candidate);
    }

    private final List<Candidate> candidates;
    private final OnVoteClickListener listener;
    private boolean votingEnabled = false;
    private String pendingDocId; // candidate whose vote is being submitted

    public VotingAdapter(List<Candidate> candidates, OnVoteClickListener listener) {
        this.candidates = candidates;
        this.listener = listener;
    }

    @SuppressLint("NotifyDataSetChanged")
    public void setVotingEnabled(boolean enabled) {
        votingEnabled = enabled;
        notifyDataSetChanged();
    }

    @SuppressLint("NotifyDataSetChanged")
    public void setPending(String docId) {
        pendingDocId = docId;
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public CandidateViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_voting, parent, false);
        return new CandidateViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull CandidateViewHolder h, int position) {
        Candidate c = candidates.get(position);
        h.tvElectionName.setText(c.getElectionName());
        h.tvCandidateId.setText("ID: " + c.getCandidateId());
        h.tvCandidateName.setText(c.getCandidateName());
        h.tvCandidateParty.setText(c.getCandidateParty());
        bindOptional(h.tvConstituency, c.getConstituency());
        bindOptional(h.tvDistrict, c.getDistrict());
        ImageUtils.bind(h.ivCandidatePhoto, c.getCandidatePhotoBase64());
        ImageUtils.bind(h.ivPartySymbol, c.getPartySymbolBase64());

        boolean pending = c.getDocId().equals(pendingDocId);
        if (c.isVoted()) {
            h.btnVote.setText("Voted");
        } else if (pending) {
            h.btnVote.setText("Voting…");
        } else {
            h.btnVote.setText("Vote");
        }
        h.btnVote.setEnabled(votingEnabled && !c.isVoted() && pendingDocId == null);
        h.btnVote.setOnClickListener(v -> listener.onVoteClicked(c));
    }

    private static void bindOptional(TextView view, String text) {
        if (text != null && !text.isEmpty()) {
            view.setText(text);
            view.setVisibility(View.VISIBLE);
        } else {
            view.setVisibility(View.GONE);
        }
    }

    @Override
    public int getItemCount() {
        return candidates.size();
    }

    static class CandidateViewHolder extends RecyclerView.ViewHolder {
        final TextView tvElectionName, tvCandidateId, tvCandidateName, tvCandidateParty, tvConstituency, tvDistrict;
        final ImageView ivCandidatePhoto, ivPartySymbol;
        final Button btnVote;

        CandidateViewHolder(@NonNull View itemView) {
            super(itemView);
            tvElectionName = itemView.findViewById(R.id.tvElectionName);
            tvCandidateId = itemView.findViewById(R.id.tvCandidateId);
            tvCandidateName = itemView.findViewById(R.id.tvCandidateName);
            tvCandidateParty = itemView.findViewById(R.id.tvCandidateParty);
            tvConstituency = itemView.findViewById(R.id.tvConstituency);
            tvDistrict = itemView.findViewById(R.id.tvDistrict);
            ivCandidatePhoto = itemView.findViewById(R.id.ivCandidatePhoto);
            ivPartySymbol = itemView.findViewById(R.id.ivPartySymbol);
            btnVote = itemView.findViewById(R.id.btnVote);
        }
    }
}
