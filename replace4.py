import re

file_path = 'src/Director/Director.ts'

with open(file_path, 'r') as f:
    content = f.read()

content = content.replace("} , runTimeTravelingIRSAuditLoop }", ", runTimeTravelingIRSAuditLoop }")
content = content.replace("} , runParallelUniverseCableTVLoop }", ", runParallelUniverseCableTVLoop }")
content = content.replace("| 'time_traveling_chef' | 'galactic_hoa_meeting' | 'parallel_universe_cable_tv' | 'sentient_cloud_infrastructure' | 'time_traveling_irs_audit';", "| 'time_traveling_chef' | 'galactic_hoa_meeting' | 'parallel_universe_cable_tv' | 'sentient_cloud_infrastructure' | 'time_traveling_irs_audit';") # just in case

with open(file_path, 'w') as f:
    f.write(content)
