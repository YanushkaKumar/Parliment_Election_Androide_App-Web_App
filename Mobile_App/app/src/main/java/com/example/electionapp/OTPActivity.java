package com.example.electionapp;

import android.content.Intent;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.KeyEvent;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.google.firebase.auth.FirebaseAuth;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

/** Step 2 of login: verify the emailed code on the server, then sign in with the returned custom token. */
public class OTPActivity extends AppCompatActivity {

    public static final String EXTRA_NIC = "NIC";
    public static final String EXTRA_MASKED_EMAIL = "MASKED_EMAIL";

    private final EditText[] boxes = new EditText[6];
    private Button verifyButton;
    private TextView resendView;
    private String nic;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_otpactivity);

        nic = getIntent().getStringExtra(EXTRA_NIC);
        if (nic == null) {
            finish();
            return;
        }
        String masked = getIntent().getStringExtra(EXTRA_MASKED_EMAIL);
        if (masked != null) {
            ((TextView) findViewById(R.id.tvOtpSubtitle)).setText("We emailed a 6-digit code to " + masked + ".");
        }

        int[] ids = {R.id.otpBox1, R.id.otpBox2, R.id.otpBox3, R.id.otpBox4, R.id.otpBox5, R.id.otpBox6};
        for (int i = 0; i < ids.length; i++) {
            boxes[i] = findViewById(ids[i]);
        }
        wireBoxes();

        verifyButton = findViewById(R.id.verifyButton);
        verifyButton.setOnClickListener(v -> verify());

        resendView = findViewById(R.id.tvResend);
        resendView.setOnClickListener(v -> resend());
    }

    private void wireBoxes() {
        for (int i = 0; i < boxes.length; i++) {
            final int index = i;
            boxes[i].addTextChangedListener(new TextWatcher() {
                @Override public void beforeTextChanged(CharSequence s, int st, int c, int a) {}
                @Override public void onTextChanged(CharSequence s, int st, int b, int c) {}

                @Override
                public void afterTextChanged(Editable s) {
                    if (s.length() > 1) {
                        // Pasted the whole code into one box: spread it out.
                        String digits = s.toString().replaceAll("\\D", "");
                        s.clear();
                        fillFrom(index, digits);
                        return;
                    }
                    if (s.length() == 1 && index < boxes.length - 1) {
                        boxes[index + 1].requestFocus();
                    } else if (s.length() == 1 && code().length() == boxes.length) {
                        verify();
                    }
                }
            });
            boxes[i].setOnKeyListener((v, keyCode, event) -> {
                if (keyCode == KeyEvent.KEYCODE_DEL && event.getAction() == KeyEvent.ACTION_DOWN
                        && boxes[index].getText().length() == 0 && index > 0) {
                    boxes[index - 1].setText("");
                    boxes[index - 1].requestFocus();
                    return true;
                }
                return false;
            });
        }
        // Lift the 1-char limit on the first box so a pasted 6-digit code arrives intact (spread out above).
        boxes[0].setFilters(new android.text.InputFilter[0]);
    }

    private void fillFrom(int start, String digits) {
        for (int i = 0; i < digits.length() && start + i < boxes.length; i++) {
            boxes[start + i].setText(String.valueOf(digits.charAt(i)));
        }
    }

    private String code() {
        StringBuilder sb = new StringBuilder();
        for (EditText box : boxes) sb.append(box.getText().toString().trim());
        return sb.toString();
    }

    private void clearBoxes() {
        for (EditText box : boxes) box.setText("");
        boxes[0].requestFocus();
    }

    private void verify() {
        String otp = code();
        if (otp.length() != boxes.length) {
            Toast.makeText(this, "Enter all 6 digits", Toast.LENGTH_SHORT).show();
            return;
        }
        if (!verifyButton.isEnabled()) return; // already verifying
        setLoading(true);

        Map<String, Object> data = new HashMap<>();
        data.put("nic", nic);
        data.put("otp", otp);

        Session.functions().getHttpsCallable("verifyOtp").call(data)
                .continueWithTask(task -> {
                    Map<?, ?> result = (Map<?, ?>) task.getResult().getData();
                    String token = (String) result.get("token");
                    return FirebaseAuth.getInstance().signInWithCustomToken(token);
                })
                .addOnSuccessListener(auth -> {
                    Intent intent = new Intent(this, ElectionHomeActivity.class);
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
                    startActivity(intent);
                })
                .addOnFailureListener(e -> {
                    setLoading(false);
                    clearBoxes();
                    Toast.makeText(this, Session.errorMessage(e, "Verification failed. Try again."),
                            Toast.LENGTH_LONG).show();
                });
    }

    private void resend() {
        resendView.setEnabled(false);
        Session.functions().getHttpsCallable("requestOtp").call(Collections.singletonMap("nic", nic))
                .addOnSuccessListener(r -> {
                    resendView.setEnabled(true);
                    clearBoxes();
                    Toast.makeText(this, "A new code has been sent.", Toast.LENGTH_SHORT).show();
                })
                .addOnFailureListener(e -> {
                    resendView.setEnabled(true);
                    Toast.makeText(this, Session.errorMessage(e, "Could not resend the code."),
                            Toast.LENGTH_LONG).show();
                });
    }

    private void setLoading(boolean loading) {
        verifyButton.setEnabled(!loading);
        verifyButton.setText(loading ? "Verifying…" : "Verify");
    }
}
