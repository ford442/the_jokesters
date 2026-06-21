import re

file_path = 'src/Director/Director.ts'

with open(file_path, 'r') as f:
    content = f.read()

# Add mode imports
content = re.sub(
    r"import \{ runTimeTravelingChefLoop \} from '\./modes/DreamModes_Temporal';",
    "import { runTimeTravelingChefLoop, runTimeTravelingIRSAuditLoop } from './modes/DreamModes_Temporal';",
    content
)

content = re.sub(
    r"import \{ runGalacticHOAMeetingLoop \} from '\./modes/DreamModes_Scifi';",
    "import { runGalacticHOAMeetingLoop, runParallelUniverseCableTVLoop } from './modes/DreamModes_Scifi';",
    content
)

content = re.sub(
    r"import \{ runSmartThermostatRebellionLoop \} from '\./modes/DreamModes_Tech';",
    "import { runSmartThermostatRebellionLoop, runSentientCloudInfrastructureLoop } from './modes/DreamModes_Tech';",
    content
)

# Add to Scenario type
content = re.sub(
    r"'time_traveling_chef' \| 'galactic_hoa_meeting'",
    "'time_traveling_chef' | 'galactic_hoa_meeting' | 'parallel_universe_cable_tv' | 'sentient_cloud_infrastructure' | 'time_traveling_irs_audit'",
    content
)

# Add to MODE_LOOPS
content = re.sub(
    r"'galactic_hoa_meeting': runGalacticHOAMeetingLoop",
    "'galactic_hoa_meeting': runGalacticHOAMeetingLoop,\n    'parallel_universe_cable_tv': runParallelUniverseCableTVLoop,\n    'sentient_cloud_infrastructure': runSentientCloudInfrastructureLoop,\n    'time_traveling_irs_audit': runTimeTravelingIRSAuditLoop",
    content
)

with open(file_path, 'w') as f:
    f.write(content)
