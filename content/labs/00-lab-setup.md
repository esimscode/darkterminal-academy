# Lab 00: Lab Environment
**Objectives:** 1.x (segmentation), 3.x (secure infrastructure)

## Suggested hardware
16 GB RAM minimum (32 GB is better). Hypervisor: VirtualBox, VMware Workstation Pro (free) or Proxmox.

| VM | OS | RAM | Firmware | Role |
|---|---|---|---|---|
| wazuh | Ubuntu Server 24.04 LTS (officially supported) or 26.04 LTS (works; see FAQ) | 8 GB, 4 vCPU, 50 GB+ disk | UEFI | Wazuh manager/indexer/dashboard (all-in-one) |
| win-victim | Windows 10/11 eval | 4 GB | UEFI + Secure Boot + TPM 2.0 (required by Windows 11) | Wazuh agent + Sysmon |
| (optional) linux-victim | Ubuntu | 2 GB | UEFI | Linux agent, auditd |
| (optional) pfSense/OPNsense | — | 1 GB | UEFI | Firewall + Suricata |

## Network
- Host-only or internal network (e.g. `10.10.10.0/24`). The victim VMs get **no internet access** while you run simulations.
- Take a snapshot called `clean-baseline` once each VM is set up.

## FAQ
Questions learners have asked while doing this lab. Ask yours by opening a [Lab question issue](https://github.com/esimscode/darkterminal-labs/issues/new?template=lab-question.yml).

### Should my VMs use UEFI or legacy BIOS boot firmware?
**UEFI.** It's the modern standard, every OS in this lab supports it, and Windows 11 *requires* it (with Secure Boot and TPM 2.0). Only fall back to legacy BIOS if a VM won't boot under UEFI.

Where to set it, by hypervisor:

| Host | Hypervisor | Setting |
|---|---|---|
| Intel Mac | VirtualBox 7 | Settings → System → Motherboard → tick **Enable EFI** |
| Intel Mac | VMware Fusion | UEFI is the default (Settings → Advanced → Firmware type) |
| Intel Mac | UTM | **UEFI Boot** is ticked by default under QEMU settings |
| Windows | VirtualBox 7 | Same **Enable EFI** checkbox as above |
| Windows | VMware Workstation | UEFI is the default (VM Settings → Options → Advanced) |
| Windows | Hyper-V | Use **Generation 2** VMs. For Linux guests, set the Secure Boot template to **Microsoft UEFI Certificate Authority** |
| Linux | KVM / virt-manager | Tick **Customize configuration before install**, then set Firmware to **UEFI** (OVMF) |
| Apple Silicon Mac | UTM / VMware Fusion / Parallels | UEFI only. You must use **ARM64** ISOs (Ubuntu Server arm64, Windows 11 ARM); x86 ISOs won't run at usable speed |

**Exam link:** UEFI, Secure Boot, measured boot and TPM are Security+ hardware-security topics (firmware integrity and boot attacks such as bootkits). Note *why* Windows 11 enforces them; it's a likely exam question.

### Can I use Ubuntu 26.04 LTS for the Wazuh server?
It works, but at the time of writing Wazuh's official compatibility list stops at Ubuntu 22.04 and 24.04. The installer may stop with an "unsupported OS" warning; you can run it with `-i` (ignore check) to continue.

- **Want the fewest surprises?** Use **24.04 LTS** for the Wazuh VM.
- **Already on 26.04?** Keep it, use the `-i` flag, and note it in your journal. Running an unsupported-but-working platform is a real-world trade-off worth writing about.

## Evidence to capture
- [ ] A network diagram (draw.io), saved to `evidence/`
- [ ] Screenshot of the VM inventory
