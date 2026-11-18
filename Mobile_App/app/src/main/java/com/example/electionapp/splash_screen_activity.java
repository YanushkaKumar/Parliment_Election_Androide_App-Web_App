package com.example.electionapp;

import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;

import androidx.appcompat.app.AppCompatActivity;

public class splash_screen_activity extends AppCompatActivity {

    private static final int SPLASH_DELAY_MS = 1500;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Runnable next = () -> {
        // Skip login if a voter session is still valid.
        Class<?> target = Session.voterId() != null ? ElectionHomeActivity.class : VLogingActivity.class;
        startActivity(new Intent(this, target));
        finish();
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_splash_screen);
        handler.postDelayed(next, SPLASH_DELAY_MS);
    }

    @Override
    protected void onDestroy() {
        handler.removeCallbacks(next);
        super.onDestroy();
    }
}
