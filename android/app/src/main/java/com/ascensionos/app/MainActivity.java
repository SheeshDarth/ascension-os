package com.ascensionos.app;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    public MainActivity() {
        registerPlugin(AscensionDevicePlugin.class);
    }
}
