package com.example.electionapp;

import android.app.Activity;
import android.app.Application;
import android.os.Bundle;
import android.util.Log;
import android.view.View;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.firestore.FirebaseFirestore;

public class ElectionApp extends Application {

    /** The host machine's localhost as seen from the Android emulator. */
    private static final String EMULATOR_HOST = "10.0.2.2";

    @Override
    public void onCreate() {
        super.onCreate();
        if (BuildConfig.USE_EMULATORS) {
            FirebaseAuth.getInstance().useEmulator(EMULATOR_HOST, 9099);
            FirebaseFirestore.getInstance().useEmulator(EMULATOR_HOST, 8080);
            Session.functions().useEmulator(EMULATOR_HOST, 5001);
            Log.i("ElectionApp", "Using local Firebase emulators at " + EMULATOR_HOST);
        }
        registerActivityLifecycleCallbacks(new SystemBarInsets());
    }

    /**
     * Apps targeting SDK 35+ are drawn edge-to-edge, so content would sit under the status and
     * navigation bars. Pad every screen's content by the system bar insets.
     */
    private static final class SystemBarInsets implements ActivityLifecycleCallbacks {
        @Override
        public void onActivityStarted(@NonNull Activity activity) {
            View content = activity.findViewById(android.R.id.content);
            if (content == null || content.getTag(R.id.insets_applied) != null) return;
            content.setTag(R.id.insets_applied, Boolean.TRUE);
            ViewCompat.setOnApplyWindowInsetsListener(content, (v, insets) -> {
                Insets bars = insets.getInsets(
                        WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout());
                v.setPadding(bars.left, bars.top, bars.right, bars.bottom);
                return insets;
            });
            ViewCompat.requestApplyInsets(content);
        }

        @Override public void onActivityCreated(@NonNull Activity a, @Nullable Bundle b) {}
        @Override public void onActivityResumed(@NonNull Activity a) {}
        @Override public void onActivityPaused(@NonNull Activity a) {}
        @Override public void onActivityStopped(@NonNull Activity a) {}
        @Override public void onActivitySaveInstanceState(@NonNull Activity a, @NonNull Bundle b) {}
        @Override public void onActivityDestroyed(@NonNull Activity a) {}
    }
}
