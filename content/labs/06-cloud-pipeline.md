# Lab 06: Cloud Detection Pipeline (AWS)
**Objectives:** 3.x (cloud architecture), 4.x (cloud monitoring)

1. Create a **separate** AWS account. Enable MFA on root and use an IAM user or role with least privilege. Set a billing alarm at $5.
2. Turn on CloudTrail and send it to an S3 bucket.
3. Set up the Wazuh `aws-s3` wodle to read the CloudTrail bucket. Docs: https://documentation.wazuh.com/current/cloud-security/amazon/
4. Simulate some suspicious activity: failed console logins, creating an access key, `DeleteTrail`/`StopLogging`, making an S3 bucket public.
5. Write a Wazuh rule for `StopLogging` (an attacker tampering with defenses).
6. Deliverable: a pipeline diagram, the alerts, and a cost note. **Tear everything down afterwards.**

## Evidence
- [ ] Screenshot: billing alarm and root-account MFA turned on
- [ ] A pipeline diagram (CloudTrail → S3 → Wazuh)
- [ ] Screenshot: CloudTrail events showing up in Wazuh
- [ ] A custom rule for `StopLogging`, with a screenshot of it firing
- [ ] Confirmation that everything was torn down, plus a cost note
