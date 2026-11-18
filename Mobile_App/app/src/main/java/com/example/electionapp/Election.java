package com.example.electionapp;

import com.google.firebase.firestore.DocumentSnapshot;

public class Election {
    private final String id;
    private final String name;
    private final String date;      // yyyy-MM-dd
    private final String startTime; // HH:mm, Asia/Colombo
    private final String endTime;   // HH:mm, Asia/Colombo

    public Election(String id, String name, String date, String startTime, String endTime) {
        this.id = id;
        this.name = name;
        this.date = date;
        this.startTime = startTime != null ? startTime : ElectionTime.DEFAULT_START;
        this.endTime = endTime != null ? endTime : ElectionTime.DEFAULT_END;
    }

    /** Returns null if the document is missing required fields. */
    public static Election fromDocument(DocumentSnapshot doc) {
        String name = doc.getString("name");
        String date = doc.getString("date");
        if (name == null || date == null) return null;
        return new Election(doc.getId(), name, date, doc.getString("startTime"), doc.getString("endTime"));
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public String getDate() { return date; }
    public String getStartTime() { return startTime; }
    public String getEndTime() { return endTime; }
}
