package com.example.electionapp;

import android.content.Intent;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;

public class OTPActivity extends AppCompatActivity {

    private EditText otpBox1, otpBox2, otpBox3, otpBox4;
    private Button verifyButton;
    private String correctOTP;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_otpactivity);

        // Initialize views
        otpBox1 = findViewById(R.id.otpBox1);
        otpBox2 = findViewById(R.id.otpBox2);
        otpBox3 = findViewById(R.id.otpBox3);
        otpBox4 = findViewById(R.id.otpBox4);
        verifyButton = findViewById(R.id.verifyButton);

        // Retrieve OTP from the intent
        correctOTP = getIntent().getStringExtra("OTP");

        // Add TextWatchers for auto-focus functionality
        addOTPTextWatchers();

        // Handle OTP verification on button click
        verifyButton.setOnClickListener(v -> {
            String otp = otpBox1.getText().toString() + otpBox2.getText().toString() +
                    otpBox3.getText().toString() + otpBox4.getText().toString();

            if (otp.equals(correctOTP)) {
                // OTP is correct
                Toast.makeText(OTPActivity.this, "OTP Verified Successfully!", Toast.LENGTH_SHORT).show();

                // Navigate to ElectionHomeActivity
                Intent intent = new Intent(OTPActivity.this, ElectionHomeActivity.class);
                startActivity(intent);
                finish(); // Close this activity to prevent going back
            } else {
                // OTP is incorrect
                Toast.makeText(OTPActivity.this, "Invalid OTP. Please try again.", Toast.LENGTH_SHORT).show();
                clearOTPFields();
            }
        });
    }

    private void addOTPTextWatchers() {
        otpBox1.addTextChangedListener(new OTPTextWatcher(otpBox2));
        otpBox2.addTextChangedListener(new OTPTextWatcher(otpBox3));
        otpBox3.addTextChangedListener(new OTPTextWatcher(otpBox4));
        otpBox4.addTextChangedListener(new OTPTextWatcher(null));
    }

    private class OTPTextWatcher implements TextWatcher {
        private EditText nextBox;

        OTPTextWatcher(EditText nextBox) {
            this.nextBox = nextBox;
        }

        @Override
        public void beforeTextChanged(CharSequence charSequence, int start, int count, int after) {}

        @Override
        public void onTextChanged(CharSequence charSequence, int start, int before, int after) {}

        @Override
        public void afterTextChanged(Editable editable) {
            if (editable.length() > 0 && nextBox != null) {
                nextBox.requestFocus();
            }
        }
    }

    private void clearOTPFields() {
        otpBox1.setText("");
        otpBox2.setText("");
        otpBox3.setText("");
        otpBox4.setText("");
    }
}
