# Lab 02: Adversary Simulation with Atomic Red Team
**Objectives:** 2.x (attack types, indicators), 4.x (IR and investigation)

> Run this **only** on the isolated victim VM. Revert to `clean-baseline` when you're done.

## Setup
Install Invoke-AtomicRedTeam by following the official wiki:
https://github.com/redcanaryco/invoke-atomicredteam/wiki
Defender will flag the atomics folder. In the **lab VM only**, add a Defender exclusion for that folder. Write down that you did this: it is a detection gap to discuss in your report.

## Workflow for each technique
1. Read the test definition first: `Invoke-AtomicTest <TID> -ShowDetails`
2. Check prerequisites: `-CheckPrereqs` (and `-GetPrereqs` if needed)
3. Run it and **record the time** you ran it
4. Find the activity in Wazuh. Did an alert fire? At what level? Which rule ID?
5. Clean up: `Invoke-AtomicTest <TID> -Cleanup`
6. Fill in one row of the table below

## Suggested techniques (one per tactic)
| Tactic | Technique | Alert? | Rule ID | Notes |
|---|---|---|---|---|
| Execution | T1059.001 PowerShell | | | |
| Execution | T1059.003 Windows Command Shell | | | |
| Persistence | T1547.001 Registry Run Keys | | | |
| Persistence | T1053.005 Scheduled Task | | | |
| Credential Access | T1003.001 LSASS Memory | | | |
| Discovery | T1087.001 Local Account Discovery | | | |
| Defense Evasion | T1070.001 Clear Windows Event Logs | | | |
| Privilege Escalation | T1548.002 UAC Bypass | | | |

The empty "Alert?" cells are your **detection gaps**. They are what Lab 03 and your report are about.

## Evidence
- [ ] Screenshot: Invoke-AtomicRedTeam installed and `-ShowDetails` output for one test
- [ ] The technique table above, filled in for at least 5 techniques
- [ ] Screenshot: at least one Wazuh alert tied to an atomic test
- [ ] A list of detection gaps (techniques that produced no alert)
- [ ] Confirmation that you reverted to the `clean-baseline` snapshot
