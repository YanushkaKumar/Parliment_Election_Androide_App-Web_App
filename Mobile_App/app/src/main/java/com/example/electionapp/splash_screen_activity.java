package com.example.electionapp;

import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import androidx.appcompat.app.AppCompatActivity;

public class splash_screen_activity extends AppCompatActivity {

    private static final int SPLASH_DELAY = 3000; // 3 seconds delay

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_splash_screen);

        // Navigate to MainActivity after a delay
        new Handler().postDelayed(() -> {
            Intent intent = new Intent(splash_screen_activity.this, VLogingActivity.class);
            startActivity(intent);
            finish(); // Close splash screen so it's not in the back stack
        }, SPLASH_DELAY);
    }
}
