#!/usr/bin/env bash

# This script is used to fix the WSL environment for the current user.

sudo service dbus start
declare XDG_RUNTIME_DIR
XDG_RUNTIME_DIR=/run/user/$(id -u)
export XDG_RUNTIME_DIR

# Ensure the XDG_RUNTIME_DIR exists and has the correct permissions
if [ ! -d "$XDG_RUNTIME_DIR" ]; then
  echo "Creating XDG_RUNTIME_DIR at $XDG_RUNTIME_DIR"
  sudo mkdir -p "$XDG_RUNTIME_DIR"
fi

if [ ! -w "$XDG_RUNTIME_DIR" ]; then
  echo "Setting permissions for XDG_RUNTIME_DIR"
  sudo chmod 700 "$XDG_RUNTIME_DIR"
fi

if [ ! -O "$XDG_RUNTIME_DIR" ]; then
  echo "Setting ownership for XDG_RUNTIME_DIR"
  sudo chown "$(id -un):$(id -gn)" "$XDG_RUNTIME_DIR"
fi

# Start the D-Bus session daemon
if ! pgrep -x "dbus-daemon" > /dev/null; then
  echo "Starting D-Bus session daemon"
else
  echo "D-Bus session daemon is already running"
fi

# Set the DBUS_SESSION_BUS_ADDRESS environment variable
if [ -z "$DBUS_SESSION_BUS_ADDRESS" ]; then
  echo "Setting DBUS_SESSION_BUS_ADDRESS"
  export DBUS_SESSION_BUS_ADDRESS="unix:path=$XDG_RUNTIME_DIR/bus"
else
  echo "DBUS_SESSION_BUS_ADDRESS is already set"
fi