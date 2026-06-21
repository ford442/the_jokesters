import re

file_path = 'src/Director/Director.ts'

with open(file_path, 'r') as f:
    content = f.read()

# Let's fix the other imports just to be sure
if "runSmartThermostatRebellionLoop, runSentientCloudInfrastructureLoop }" not in content:
    content = content.replace("runSmartThermostatRebellionLoop }", "runSmartThermostatRebellionLoop, runSentientCloudInfrastructureLoop }")

if "| 'galactic_hoa_meeting' | 'parallel_universe_cable_tv'" not in content:
    content = content.replace("| 'galactic_hoa_meeting';", "| 'galactic_hoa_meeting' | 'parallel_universe_cable_tv' | 'sentient_cloud_infrastructure' | 'time_traveling_irs_audit';")

if "'time_traveling_irs_audit': runTimeTravelingIRSAuditLoop" not in content:
    content = content.replace("'galactic_hoa_meeting': runGalacticHOAMeetingLoop,", "'galactic_hoa_meeting': runGalacticHOAMeetingLoop,\n    'parallel_universe_cable_tv': runParallelUniverseCableTVLoop,\n    'sentient_cloud_infrastructure': runSentientCloudInfrastructureLoop,\n    'time_traveling_irs_audit': runTimeTravelingIRSAuditLoop,")

with open(file_path, 'w') as f:
    f.write(content)
