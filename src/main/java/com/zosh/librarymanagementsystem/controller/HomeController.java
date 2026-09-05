package com.zosh.librarymanagementsystem.controller;

import com.zosh.librarymanagementsystem.payload.response.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HomeController {

    @GetMapping("/")
    public ApiResponse home() {
        return new ApiResponse("Backend Library Management System đang hoạt động", true);
    }
}
