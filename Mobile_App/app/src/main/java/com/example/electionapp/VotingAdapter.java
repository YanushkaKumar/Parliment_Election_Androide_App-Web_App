package com.example.electionapp;

import android.annotation.SuppressLint;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Handler;
import android.util.Base64;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class VotingAdapter extends RecyclerView.Adapter<VotingAdapter.CandidateViewHolder> {

    private List<Candidate> candidateList;
    private OnVoteButtonClickListener listener;
    private boolean isVotingDisabled = false;
    private int votesRemaining = 3; // Initialize with 3 votes per voter
    private Set<String> votedCandidateIds = new HashSet<>(); // Track which candidates received votes
    private String currentVoterNIC; // Store the current voter's NIC

    public interface OnVoteButtonClickListener {
        void onVoteButtonClicked(Candidate candidate, int remainingVotes);
        void onVotingCompleted(); // Called when all 3 votes are used or time expires
    }

    public VotingAdapter(List<Candidate> candidateList, OnVoteButtonClickListener listener) {
        this.candidateList = candidateList;
        this.listener = listener;
    }

    /**
     * Sets the number of votes remaining for the current voter
     * @param votes The number of votes remaining
     */
    public void setVotesRemaining(int votes) {
        this.votesRemaining = votes;

        // If no votes remaining, disable voting
        if (this.votesRemaining <= 0) {
            this.isVotingDisabled = true;
        } else {
            this.isVotingDisabled = false;
        }

        notifyDataSetChanged();
    }

    /**
     * Sets previously voted candidates from a previous session
     * @param previouslyVotedCandidates Set of candidate IDs that were previously voted for
     */
    public void setPreviouslyVotedCandidates(Set<String> previouslyVotedCandidates) {
        if (previouslyVotedCandidates != null) {
            this.votedCandidateIds.clear();
            this.votedCandidateIds.addAll(previouslyVotedCandidates);
            this.votesRemaining = Math.max(0, 3 - previouslyVotedCandidates.size());

            // If all votes have been used, disable voting
            if (this.votesRemaining == 0) {
                this.isVotingDisabled = true;
            }

            notifyDataSetChanged();
        }
    }

    /**
     * Sets the current voter's NIC and resets voting state
     * @param nic The voter's National ID Card number
     */
    public void setVoterNIC(String nic) {
        this.currentVoterNIC = nic;
        resetVotingState();
    }

    /**
     * Resets the voting state for a new voter
     */
    public void resetVotingState() {
        votesRemaining = 3;
        votedCandidateIds.clear();
        isVotingDisabled = false;
        notifyDataSetChanged();
    }

    // Update the setVotingDisabled method
    public void setVotingDisabled(boolean disabled) {
        try {
            this.isVotingDisabled = disabled;
            notifyDataSetChanged();
        } catch (Exception e) {
            System.out.println("Error setting voting disabled: " + e.getMessage());
        }
    }


    /**
     * Records a vote for a candidate
     * @param candidateId The ID of the selected candidate
     * @return true if vote was recorded, false if not
     */

    @SuppressLint("NotifyDataSetChanged")
    public boolean recordVote(String candidateId) {
        try {
            // Check if already voted for this candidate
            if (votedCandidateIds.contains(candidateId)) {
                return false;
            }

            // Check if we have votes remaining
            if (votesRemaining <= 0) {
                return false;
            }

            // Record the vote
            votedCandidateIds.add(candidateId);
            votesRemaining--;

            // Update candidate in the list
            for (Candidate candidate : candidateList) {
                if (candidate.getCandidateId().equals(candidateId)) {
                    candidate.setVoted(true);
                    candidate.incrementVotes();
                    break;
                }
            }

            // Notify adapter of changes
            notifyDataSetChanged();

            return true;
        } catch (Exception e) {
            System.out.println("Error recording vote: " + e.getMessage());
            return false;
        }
    }

    /**
     * Gets the remaining votes for the current voter
     */
    public int getVotesRemaining() {
        return votesRemaining;
    }

    /**
     * Checks if a specific candidate has been voted for
     */
    public boolean hasVotedForCandidate(String candidateId) {
        return votedCandidateIds.contains(candidateId);
    }

    /**
     * Gets the set of candidate IDs that have been voted for
     */
    public Set<String> getVotedCandidateIds() {
        return new HashSet<>(votedCandidateIds);
    }

    @NonNull
    @Override
    public CandidateViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_voting, parent, false);
        return new CandidateViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull CandidateViewHolder holder, int position) {
        try {
            Candidate candidate = candidateList.get(position);
            String candidateId = candidate.getCandidateId();
            boolean hasVotedForThisCandidate = votedCandidateIds.contains(candidateId) || candidate.isVoted();

            // Set text fields
            holder.tvElectionName.setText(candidate.getElectionName());
            holder.tvCandidateId.setText("ID: " + candidateId);
            holder.tvCandidateName.setText(candidate.getCandidateName());
            holder.tvCandidateParty.setText(candidate.getCandidateParty());

            // Set constituency and district if available
            if (candidate.getConstituency() != null && !candidate.getConstituency().isEmpty()) {
                holder.tvConstituency.setText(candidate.getConstituency());
                holder.tvConstituency.setVisibility(View.VISIBLE);
            } else {
                holder.tvConstituency.setVisibility(View.GONE);
            }

            if (candidate.getDistrict() != null && !candidate.getDistrict().isEmpty()) {
                holder.tvDistrict.setText(candidate.getDistrict());
                holder.tvDistrict.setVisibility(View.VISIBLE);
            } else {
                holder.tvDistrict.setVisibility(View.GONE);
            }

            // Load candidate photo from Base64 if available
            if (candidate.getCandidatePhotoBase64() != null && !candidate.getCandidatePhotoBase64().isEmpty()) {
                try {
                    String base64Image = candidate.getCandidatePhotoBase64();
                    if (base64Image.contains(",")) {
                        base64Image = base64Image.split(",")[1];
                    }
                    byte[] decodedString = Base64.decode(base64Image, Base64.DEFAULT);
                    Bitmap candidatePhoto = BitmapFactory.decodeByteArray(decodedString, 0, decodedString.length);
                    holder.ivCandidatePhoto.setImageBitmap(candidatePhoto);
                    holder.ivCandidatePhoto.setVisibility(View.VISIBLE);
                } catch (Exception e) {
                    holder.ivCandidatePhoto.setVisibility(View.GONE);
                }
            } else {
                holder.ivCandidatePhoto.setVisibility(View.GONE);
            }

            // Load party symbol from Base64 if available
            if (candidate.getPartySymbolBase64() != null && !candidate.getPartySymbolBase64().isEmpty()) {
                try {
                    String base64Symbol = candidate.getPartySymbolBase64();
                    if (base64Symbol.contains(",")) {
                        base64Symbol = base64Symbol.split(",")[1];
                    }
                    byte[] decodedString = Base64.decode(base64Symbol, Base64.DEFAULT);
                    Bitmap partySymbol = BitmapFactory.decodeByteArray(decodedString, 0, decodedString.length);
                    holder.ivPartySymbol.setImageBitmap(partySymbol);
                    holder.ivPartySymbol.setVisibility(View.VISIBLE);
                } catch (Exception e) {
                    holder.ivPartySymbol.setVisibility(View.GONE);
                }
            } else {
                holder.ivPartySymbol.setVisibility(View.GONE);
            }

            // Setup vote button based on voting state
            boolean canVoteForThisCandidate = !isVotingDisabled && votesRemaining > 0 && !hasVotedForThisCandidate;
            holder.btnVote.setEnabled(canVoteForThisCandidate);

            // Update button text based on voting status
            if (hasVotedForThisCandidate) {
                holder.btnVote.setText("Voted");
            } else {
                holder.btnVote.setText("Vote");
            }

            holder.btnVote.setOnClickListener(v -> {
                try {
                    if (canVoteForThisCandidate && listener != null) {
                        // Record the vote
                        if (recordVote(candidateId)) {
                            // Notify the activity that a vote was cast
                            listener.onVoteButtonClicked(candidate, votesRemaining);
                        }
                    }
                } catch (Exception e) {
                    System.out.println("Error handling vote button click: " + e.getMessage());
                }
            });
        } catch (Exception e) {
            System.out.println("Error binding view holder: " + e.getMessage());
        }
    }

    @Override
    public int getItemCount() {
        return candidateList.size();
    }

    static class CandidateViewHolder extends RecyclerView.ViewHolder {
        TextView tvElectionName, tvCandidateId, tvCandidateName, tvCandidateParty, tvConstituency, tvDistrict;
        ImageView ivCandidatePhoto, ivPartySymbol;
        Button btnVote;

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