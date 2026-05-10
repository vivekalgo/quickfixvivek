package com.quickfix.customer;

import android.Manifest;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Bundle;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

	private static final String PREFS_NAME = "quickfix_prefs";
	private static final String KEY_LOCATION_PERMISSION_REQUESTED = "location_permission_requested";

	private final String[] locationPermissions = new String[] {
			Manifest.permission.ACCESS_FINE_LOCATION,
			Manifest.permission.ACCESS_COARSE_LOCATION
	};

	private ActivityResultLauncher<String[]> locationPermissionLauncher;

	@Override
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);

		locationPermissionLauncher = registerForActivityResult(
				new ActivityResultContracts.RequestMultiplePermissions(),
				result -> {
					// JS layer handles denied/rationale/settings UX when location is actually used.
				}
		);

		if (shouldRequestLocationOnFirstLaunch()) {
			locationPermissionLauncher.launch(locationPermissions);
			markLocationPermissionRequested();
		}
	}

	private boolean shouldRequestLocationOnFirstLaunch() {
		if (hasLocationPermission()) {
			return false;
		}

		SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
		return !prefs.getBoolean(KEY_LOCATION_PERMISSION_REQUESTED, false);
	}

	private void markLocationPermissionRequested() {
		SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
		prefs.edit().putBoolean(KEY_LOCATION_PERMISSION_REQUESTED, true).apply();
	}

	private boolean hasLocationPermission() {
		return ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
				|| ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;
	}
}
