package com.example.electionapp;

import android.content.Intent;
import android.os.Bundle;
import android.text.TextUtils;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import java.util.Collections;
import java.util.Map;

/** Step 1 of login: the voter enters their NIC and the server emails a one-time code. */
public class VLogingActivity extends AppCompatActivity {

    private EditText nicInput;
    private Button loginButton;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_vloging);

        nicInput = findViewById(R.id.vlogingnic);
        loginButton = findViewById(R.id.vloginButton);
        loginButton.setOnClickListener(v -> requestOtp());
    }

    private void requestOtp() {
        String nic = nicInput.getText().toString().trim();
        if (TextUtils.isEmpty(nic)) {
            nicInput.setError("Please enter your NIC");
            return;
        }

        setLoading(true);
        Session.functions()
                .getHttpsCallable("requestOtp")
                .call(Collections.singletonMap("nic", nic))
                .addOnSuccessListener(result -> {
                    setLoading(false);
                    String masked = null;
                    if (result.getData() instanceof Map) {
                        Object m = ((Map<?, ?>) result.getData()).get("maskedEmail");
                        masked = m != null ? m.toString() : null;
                    }
                    Intent intent = new Intent(this, OTPActivity.class);
                    intent.putExtra(OTPActivity.EXTRA_NIC, nic);
                    intent.putExtra(OTPActivity.EXTRA_MASKED_EMAIL, masked);
                    startActivity(intent);
                })
                .addOnFailureListener(e -> {
                    setLoading(false);
                    Toast.makeText(this, Session.errorMessage(e, "Could not send the code. Try again."),
                            Toast.LENGTH_LONG).show();
                });
    }

    private void setLoading(boolean loading) {
        loginButton.setEnabled(!loading);
        loginButton.setText(loading ? "Sending code…" : "Login");
    }
}
