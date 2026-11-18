package com.example.electionapp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeParseException;

/** Mirrors functions/src/electionWindow.js so the UI agrees with the server. */
public final class ElectionTime {

    public static final ZoneId ZONE = ZoneId.of("Asia/Colombo");
    public static final String DEFAULT_START = "09:00";
    public static final String DEFAULT_END = "16:00";
    public static final int MAX_VOTES = 3;

    public enum Status { UPCOMING, OPEN, CLOSED, INVALID }

    private ElectionTime() {}

    public static Status status(Election election) {
        return status(election, ZonedDateTime.now(ZONE));
    }

    static Status status(Election election, ZonedDateTime now) {
        LocalDate date = parseDate(election.getDate());
        if (date == null) return Status.INVALID;
        LocalDateTime local = now.withZoneSameInstant(ZONE).toLocalDateTime();
        LocalDate today = local.toLocalDate();
        if (date.isAfter(today)) return Status.UPCOMING;
        if (date.isBefore(today)) return Status.CLOSED;
        LocalTime t = local.toLocalTime();
        if (t.isBefore(start(election))) return Status.UPCOMING;
        if (!t.isBefore(end(election))) return Status.CLOSED;
        return Status.OPEN;
    }

    /** Milliseconds until voting closes today, or 0 if not open. */
    public static long millisUntilClose(Election election) {
        if (status(election) != Status.OPEN) return 0;
        ZonedDateTime now = ZonedDateTime.now(ZONE);
        ZonedDateTime close = now.toLocalDate().atTime(end(election)).atZone(ZONE);
        return Math.max(0, close.toInstant().toEpochMilli() - now.toInstant().toEpochMilli());
    }

    public static LocalTime start(Election e) {
        return parseTime(e.getStartTime(), DEFAULT_START);
    }

    public static LocalTime end(Election e) {
        return parseTime(e.getEndTime(), DEFAULT_END);
    }

    private static LocalDate parseDate(String value) {
        if (value == null) return null;
        try {
            return LocalDate.parse(value);
        } catch (DateTimeParseException ex) {
            return null;
        }
    }

    private static LocalTime parseTime(String value, String fallback) {
        try {
            return LocalTime.parse(value != null ? value : fallback);
        } catch (DateTimeParseException ex) {
            return LocalTime.parse(fallback);
        }
    }
}
