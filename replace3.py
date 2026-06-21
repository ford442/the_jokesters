import re

file_path = 'src/Director/Director.ts'

with open(file_path, 'r') as f:
    content = f.read()

# Try another approach to find the imports
if 'runTimeTravelingIRSAuditLoop' not in content:
    content = content.replace("from './modes/DreamModes_Temporal';", ", runTimeTravelingIRSAuditLoop } from './modes/DreamModes_Temporal';")
    content = content.replace("{ runTimeTravelingChefLoop,", "{ runTimeTravelingChefLoop")
    content = content.replace("import { runTimeTravelingChefLoop }", "import { runTimeTravelingChefLoop")

    content = content.replace("from './modes/DreamModes_Scifi';", ", runParallelUniverseCableTVLoop } from './modes/DreamModes_Scifi';")
    content = content.replace("import { runGalacticHOAMeetingLoop }", "import { runGalacticHOAMeetingLoop")

    content = content.replace("runSmartThermostatRebellionLoop }", "runSmartThermostatRebellionLoop, runSentientCloudInfrastructureLoop }")

    content = content.replace("| 'galactic_hoa_meeting';", "| 'galactic_hoa_meeting' | 'parallel_universe_cable_tv' | 'sentient_cloud_infrastructure' | 'time_traveling_irs_audit';")

    content = content.replace("'galactic_hoa_meeting': runGalacticHOAMeetingLoop,", "'galactic_hoa_meeting': runGalacticHOAMeetingLoop,\n    'parallel_universe_cable_tv': runParallelUniverseCableTVLoop,\n    'sentient_cloud_infrastructure': runSentientCloudInfrastructureLoop,\n    'time_traveling_irs_audit': runTimeTravelingIRSAuditLoop,")

with open(file_path, 'w') as f:
    f.write(content)
