/** Lab catalogue. `slug` must match a file in content/labs/<slug>.md. */
export type Lab = {
  slug: string;
  number: string;
  title: string;
  summary: string;
  domains: number[];
  free: boolean;
};

export const LABS: Lab[] = [
  { slug: "00-lab-setup", number: "00", title: "Lab environment", summary: "Hypervisor, isolated network, VMs and snapshots.", domains: [1, 3], free: true },
  { slug: "01-wazuh-sysmon", number: "01", title: "Wazuh + Sysmon", summary: "Deploy a SIEM and forward endpoint telemetry.", domains: [4], free: true },
  { slug: "02-attack-simulation", number: "02", title: "Attack simulation", summary: "Run Atomic Red Team tests and map them to ATT&CK.", domains: [2, 4], free: true },
  { slug: "03-custom-detections", number: "03", title: "Custom detections", summary: "Write, test and tune Wazuh and Sigma rules.", domains: [4], free: false },
  { slug: "04-hardening-sca", number: "04", title: "Hardening & vuln mgmt", summary: "CIS benchmarks, remediation and CVE triage.", domains: [1, 4], free: false },
  { slug: "05-network-ids", number: "05", title: "Network IDS", summary: "Suricata alerts correlated with host telemetry.", domains: [3, 4], free: false },
  { slug: "06-cloud-pipeline", number: "06", title: "Cloud pipeline", summary: "AWS CloudTrail into Wazuh with a tamper detection.", domains: [3, 4], free: false },
  { slug: "07-grc", number: "07", title: "GRC artifacts", summary: "Risk register, policy, BIA and vendor assessment.", domains: [5], free: false },
];

export const DOMAINS: Record<number, string> = {
  1: "General Security Concepts",
  2: "Threats, Vulnerabilities & Attacks",
  3: "Security Architecture",
  4: "Security Operations",
  5: "Security Program Mgmt & Oversight",
};

export function getLab(slug: string) {
  return LABS.find((l) => l.slug === slug);
}
