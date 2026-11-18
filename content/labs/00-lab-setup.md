# Lab 00: Lab Environment
**Objectives:** 1.x (segmentation), 3.x (secure infrastructure)

## Suggested hardware
16 GB RAM minimum (32 GB is better). Hypervisor: VirtualBox, VMware Workstation Pro (free) or Proxmox.

| VM | OS | RAM | Role |
|---|---|---|---|
| wazuh | Ubuntu Server 24.04 | 8 GB | Wazuh manager/indexer/dashboard (all-in-one) |
| win-victim | Windows 10/11 eval | 4 GB | Wazuh agent + Sysmon |
| (optional) linux-victim | Ubuntu | 2 GB | Linux agent, auditd |
| (optional) pfSense/OPNsense | — | 1 GB | Firewall + Suricata |

## Network
- Host-only or internal network (e.g. `10.10.10.0/24`). The victim VMs get **no internet access** while you run simulations.
- Take a snapshot called `clean-baseline` once each VM is set up.

## Evidence to capture
- [ ] A network diagram (draw.io), saved to `evidence/`
- [ ] Screenshot of the VM inventory
