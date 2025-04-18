package com.example.electionapp;

public class Voter {
    private String name;
    private String nic;
    private String address;
    private String phoneNumber;

    // **Empty Constructor (Required for Firestore)**
    public Voter() {
    }

    // **Constructor**
    public Voter(String name, String nic, String address, String phoneNumber) {
        this.name = name;
        this.nic = nic;
        this.address = address;
        this.phoneNumber = phoneNumber;
    }

    // **Getters**
    public String getName() {
        return name;
    }

    public String getNic() {
        return nic;
    }

    public String getAddress() {
        return address;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    // **Setters (Optional, but useful if you modify data later)**
    public void setName(String name) {
        this.name = name;
    }


}
