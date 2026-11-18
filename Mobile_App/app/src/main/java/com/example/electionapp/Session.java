package com.example.electionapp;

import android.content.Context;
import android.content.Intent;

import androidx.annotation.Nullable;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;
import com.google.firebase.functions.FirebaseFunctions;
import com.google.firebase.functions.FirebaseFunctionsException;

/** Voter session helpers. Voters are signed in with a custom token whose uid is "voter_<voterDocId>". */
public final class Session {

    /** Must match REGION in functions/index.js. */
    public static final String FUNCTIONS_REGION = "asia-south1";

    private static final String VOTER_UID_PREFIX = "voter_";

    private Session() {}

    public static FirebaseFunctions functions() {
        return FirebaseFunctions.getInstance(FUNCTIONS_REGION);
    }

    /** The signed-in voter's Firestore document id, or null if no voter is signed in. */
    @Nullable
    public static String voterId() {
        FirebaseUser user = FirebaseAuth.getInstance().getCurrentUser();
        if (user == null || !user.getUid().startsWith(VOTER_UID_PREFIX)) {
            return null;
        }
        return user.getUid().substring(VOTER_UID_PREFIX.length());
    }

    public static void logout(Context context) {
        FirebaseAuth.getInstance().signOut();
        Intent intent = new Intent(context, VLogingActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        context.startActivity(intent);
    }

    /** User-facing message for a failed callable function / Firebase task. */
    public static String errorMessage(@Nullable Exception e, String fallback) {
        if (e instanceof FirebaseFunctionsException) {
            FirebaseFunctionsException fe = (FirebaseFunctionsException) e;
            if (fe.getCode() != FirebaseFunctionsException.Code.INTERNAL
                    && fe.getMessage() != null && !fe.getMessage().isEmpty()) {
                return fe.getMessage();
            }
            if (fe.getCode() == FirebaseFunctionsException.Code.UNAVAILABLE) {
                return "No connection. Check your internet and try again.";
            }
        }
        return fallback;
    }
}
