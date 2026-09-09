package com.zosh.librarymanagementsystem.payload.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UserStatsResponse {

    private long totalUsers;
    private long totalReaders;
    private long totalAdmins;
    private long totalVerified;
    private long totalUnverified;
}
