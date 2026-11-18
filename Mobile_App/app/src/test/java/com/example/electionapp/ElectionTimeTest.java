package com.example.electionapp;

import static org.junit.Assert.assertEquals;

import com.example.electionapp.ElectionTime.Status;

import org.junit.Test;

import java.time.ZonedDateTime;

/** Same cases as functions/test/electionWindow.test.js so client and server agree. */
public class ElectionTimeTest {

    private static ZonedDateTime utc(String iso) {
        return ZonedDateTime.parse(iso);
    }

    private static Election on(String date, String start, String end) {
        return new Election("id", "Test", date, start, end);
    }

    @Test
    public void defaultWindow() {
        Election e = on("2026-03-10", null, null);
        assertEquals(Status.UPCOMING, ElectionTime.status(e, utc("2026-03-10T03:29:00Z"))); // 08:59
        assertEquals(Status.OPEN, ElectionTime.status(e, utc("2026-03-10T03:30:00Z")));     // 09:00
        assertEquals(Status.OPEN, ElectionTime.status(e, utc("2026-03-10T10:29:00Z")));     // 15:59
        assertEquals(Status.CLOSED, ElectionTime.status(e, utc("2026-03-10T10:30:00Z")));   // 16:00
    }

    @Test
    public void otherDays() {
        Election e = on("2026-03-10", null, null);
        assertEquals(Status.UPCOMING, ElectionTime.status(e, utc("2026-03-09T05:00:00Z")));
        assertEquals(Status.CLOSED, ElectionTime.status(e, utc("2026-03-11T05:00:00Z")));
        // 20:00 UTC on the 9th is 01:30 on the 10th in Colombo: same day, before opening.
        assertEquals(Status.UPCOMING, ElectionTime.status(e, utc("2026-03-09T20:00:00Z")));
    }

    @Test
    public void customTimesAndBadInput() {
        Election e = on("2026-03-10", "07:00", "19:00");
        assertEquals(Status.OPEN, ElectionTime.status(e, utc("2026-03-10T01:45:00Z"))); // 07:15
        assertEquals(Status.OPEN, ElectionTime.status(e, utc("2026-03-10T13:00:00Z"))); // 18:30
        assertEquals(Status.UPCOMING,
                ElectionTime.status(on("2026-03-10", "bogus", null), utc("2026-03-10T03:00:00Z")));
        assertEquals(Status.INVALID, ElectionTime.status(on("03/10/26", null, null), utc("2026-03-10T05:00:00Z")));
    }
}
