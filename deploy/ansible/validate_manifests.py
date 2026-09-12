"""Validate rendered Kubernetes resources without connecting to a cluster."""
import sys
from pathlib import Path

import kubernetes_validate
import yaml

count = 0
for manifest in sorted(Path(sys.argv[1]).glob('*.yml')):
    for resource in yaml.safe_load_all(manifest.read_text()):
        if resource is not None:
            kubernetes_validate.validate(resource, desired_version='1.34.0', strict=True)
            count += 1
if count == 0:
    raise SystemExit('No Kubernetes resources found')
print(f'Validated {count} Kubernetes resources against strict schemas')
