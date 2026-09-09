package com.zosh.librarymanagementsystem.payload.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class SubscriptionStatsResponse {

    private long totalSubscriptions;
    private long activeSubscriptions;
    private long pendingSubscriptions;
    private long expiredSubscriptions;
    private long cancelledSubscriptions;
}
