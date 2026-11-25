# Lab 01: Wazuh Manager + Agent + Sysmon
**Objectives:** 4.x (log sources, SIEM, alerting and monitoring)

## 1. Install Wazuh (all-in-one) on the Ubuntu VM
Follow the official quickstart: https://documentation.wazuh.com/current/quickstart.html
```bash
curl -sO https://packages.wazuh.com/4.x/wazuh-install.sh && sudo bash ./wazuh-install.sh -a
```
On Ubuntu 26.04 the installer may refuse with an unsupported-OS warning; add `-i` to ignore the check (see the Lab 00 FAQ).

Write down the admin password it prints. The dashboard is at `https://<wazuh-ip>`.

## 2. Install Sysmon on Windows
- Download Sysmon from Microsoft Sysinternals.
- Use a community config, e.g. SwiftOnSecurity `sysmonconfig-export.xml` or olafhartong `sysmon-modular`.
```powershell
.\Sysmon64.exe -accepteula -i sysmonconfig-export.xml
```

## 3. Install the Wazuh agent and forward Sysmon events
Use the dashboard → *Deploy new agent* wizard. Then add this to `C:\Program Files (x86)\ossec-agent\ossec.conf`:
```xml
<localfile>
  <location>Microsoft-Windows-Sysmon/Operational</location>
  <log_format>eventchannel</log_format>
</localfile>
```
Restart the agent: `Restart-Service WazuhSvc`

## 4. Check that it works
- In Discover, filter `data.win.system.channel: Microsoft-Windows-Sysmon/Operational`.
- Open notepad.exe and find the Sysmon Event ID 1 (process create) for it.

## Evidence
- [ ] Screenshot: agent listed as active
- [ ] Screenshot: a Sysmon event in Wazuh
- [ ] Notes: which Sysmon event IDs matter (1, 3, 7, 8, 10, 11, 13, 22) and why
