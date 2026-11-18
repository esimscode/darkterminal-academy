# Lab 05: Network Intrusion Detection
**Objectives:** 3.x (IDS/IPS placement), 4.x (network monitoring)

- Install Suricata on the Wazuh VM or the firewall, with the ET Open ruleset.
- Send `eve.json` to Wazuh (`<log_format>json</log_format>`).
- Generate test traffic, e.g. `curl http://testmynids.org/uid/index.html` from a lab VM that has temporary egress.
- Deliverable: one alert traced from host (Sysmon Event 3) to network (Suricata).
- Write a short note: IDS vs IPS, inline vs tap, and where you'd put a sensor in a real network.

## Evidence
- [ ] Screenshot: Suricata `eve.json` events arriving in Wazuh
- [ ] Screenshot: a Suricata alert from your test traffic
- [ ] One alert correlated between Sysmon Event 3 and Suricata
- [ ] Notes: IDS vs IPS, inline vs tap, and where you'd place a sensor
