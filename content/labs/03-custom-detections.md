# Lab 03: Detection Engineering
**Objectives:** 4.x (alert tuning, SIEM rules)

For each detection gap you found in Lab 02:
1. Write a hypothesis: "If X happens, Sysmon event Y will contain Z."
2. Write a Wazuh rule in `detections/wazuh/` and a matching Sigma rule in `detections/sigma/`.
3. Deploy the rule to `/var/ossec/etc/rules/local_rules.xml` and restart the manager.
4. Run the atomic again and confirm the alert fires.
5. Check for false positives: do normal admin tasks and see if the rule fires.
6. Write down the result (before/after screenshots).

You'll find one example rule in `detections/wazuh/local_rules.xml`.

## Evidence
- [ ] One hypothesis written for each detection gap
- [ ] At least 3 custom Wazuh rules committed to `detections/wazuh/`
- [ ] A matching Sigma rule for each, passing `sigma check`
- [ ] Before/after screenshots showing each new alert firing
- [ ] Notes on false positives you found and how you tuned them out
