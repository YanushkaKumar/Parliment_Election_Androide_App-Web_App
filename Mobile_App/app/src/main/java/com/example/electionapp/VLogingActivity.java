package com.example.electionapp;




import android.content.Intent;
import android.content.SharedPreferences;
import android.os.AsyncTask;
import android.os.Bundle;
import android.text.TextUtils;
import android.util.Log;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.firestore.DocumentSnapshot;
import com.google.firebase.firestore.FirebaseFirestore;

import java.security.SecureRandom;
import java.util.Properties;
import javax.mail.*;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeMessage;

public class VLogingActivity extends AppCompatActivity {

    private FirebaseFirestore db;
    private FirebaseAuth mAuth;
    private EditText editTextUsername;
    private Button loginButton;
    private static final String TAG = "VLogingActivity";

    // Gmail credentials (use an App Password for security)
    private static final String SENDER_EMAIL = "yanushkakumaar@gmail.com";  // Replace with your Gmail
    private static final String SENDER_PASSWORD = "mrcb mwgk ttgh qtdw"; // Generate an App Password

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_vloging);

        db = FirebaseFirestore.getInstance();
        mAuth = FirebaseAuth.getInstance();

        editTextUsername = findViewById(R.id.vlogingnic);
        loginButton = findViewById(R.id.vloginButton);

        loginButton.setOnClickListener(v -> {
            String nic = editTextUsername.getText().toString().trim();

            if (TextUtils.isEmpty(nic)) {
                Toast.makeText(VLogingActivity.this, "Please enter NIC", Toast.LENGTH_SHORT).show();
                return;
            }

            // Fetch the email using NIC from Firestore
            db.collection("voters")
                    .whereEqualTo("nic", nic)
                    .get()
                    .addOnCompleteListener(task -> {
                        if (task.isSuccessful() && !task.getResult().isEmpty()) {
                            DocumentSnapshot document = task.getResult().getDocuments().get(0);
                            String email = document.getString("email");

                            // Inside the Firestore query when login is successful
                            if (email != null && !email.isEmpty()) {
                                saveNIC(nic);
                                sendVerificationEmail(email, nic);
                            } else {
                                Toast.makeText(VLogingActivity.this, "No email associated with this NIC", Toast.LENGTH_SHORT).show();
                            }

                        } else {
                            Toast.makeText(VLogingActivity.this, "NIC not found", Toast.LENGTH_SHORT).show();
                            Log.e(TAG, "Firestore query failed: " + task.getException());
                        }
                    });
        });
    }

    private void sendVerificationEmail(String email, String nic) {
        String otp = generateOTP();  // Generate a random OTP

        // Save OTP to SharedPreferences
        SharedPreferences sharedPreferences = getSharedPreferences("ElectionAppPrefs", MODE_PRIVATE);
        SharedPreferences.Editor editor = sharedPreferences.edit();
        editor.putString("OTP", otp);  // Store OTP
        editor.apply();

        Toast.makeText(VLogingActivity.this, "OTP sent! Check your email.", Toast.LENGTH_SHORT).show();

        // Send email using Gmail SMTP
        new SendEmailTask(email, otp).execute();

        // Redirect to OTP verification screen
        Intent intent = new Intent(VLogingActivity.this, OTPActivity.class);
        intent.putExtra("OTP", otp);  // Pass the OTP to OTPActivity
        intent.putExtra("EMAIL", email);
        intent.putExtra("NIC", nic);
        startActivity(intent);
    }

    // Save NIC when user logs in
    private void saveNIC(String nic) {
        SharedPreferences sharedPreferences = getSharedPreferences("ElectionAppPrefs", MODE_PRIVATE);
        SharedPreferences.Editor editor = sharedPreferences.edit();
        editor.putString("NIC", nic);
        editor.apply();
    }

    // Generate a random 6-digit OTP
    private String generateOTP() {
        SecureRandom random = new SecureRandom();
        int otp = 1000 + random.nextInt(9000);  // Generate 4-digit OTP
        return String.valueOf(otp);
    }

    // AsyncTask to send email using Gmail SMTP
    private static class SendEmailTask extends AsyncTask<Void, Void, Boolean> {
        private final String recipientEmail;
        private final String otp;
        private static final String TAG = "GmailSMTP";

        SendEmailTask(String recipientEmail, String otp) {
            this.recipientEmail = recipientEmail;
            this.otp = otp;
        }

        @Override
        protected Boolean doInBackground(Void... voids) {
            try {
                Properties props = new Properties();
                props.put("mail.smtp.auth", "true");
                props.put("mail.smtp.starttls.enable", "true");
                props.put("mail.smtp.host", "smtp.gmail.com");
                props.put("mail.smtp.port", "587");

                Session session = Session.getInstance(props, new Authenticator() {
                    @Override
                    protected PasswordAuthentication getPasswordAuthentication() {
                        return new PasswordAuthentication(SENDER_EMAIL, SENDER_PASSWORD);
                    }
                });

                Message message = new MimeMessage(session);
                message.setFrom(new InternetAddress(SENDER_EMAIL));
                message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(recipientEmail));
                message.setSubject("OTP Verification for Election App");
                message.setText("Hello,\n\nYour OTP for verification is: " + otp + "\n\nThank you!");

                Transport.send(message);
                Log.d(TAG, "Email sent successfully to " + recipientEmail);
                return true;
            } catch (Exception e) {
                Log.e(TAG, "Email sending failed: " + e.getMessage());
                return false;
            }
        }
    }
}
