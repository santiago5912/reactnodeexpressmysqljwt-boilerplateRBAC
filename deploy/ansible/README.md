# On-premises deployment with Ansible

This deploys the React frontend and Express server to **one Linux AMD64 Kubernetes
node**, with one replica of each workload. Optional bootstrap installs K3s on a
fresh Debian/Ubuntu host. Application deployment also works with an existing
single-node cluster with a compatible ingress controller and storage class.

Traffic flows through HTTPS ingress: `/` goes to the frontend, `/api` and
`/storage` go to the server. The frontend image uses same-origin `/api/` requests.
Server uploads and private assets use separate persistent volumes. MySQL runs
outside this deployment and must already contain the application's schema/data;
this repository does not include schema migrations. Probes check HTTP availability,
not database connectivity or successful user authentication.

## Prerequisites

- One Debian/Ubuntu AMD64 node with SSH/sudo for bootstrap, outbound internet
  access for K3s and image downloads, and capacity for K3s plus application pods.
  A practical starting allocation is 2 CPU cores and 4 GiB RAM, excluding MySQL.
- A Linux Ansible controller (WSL is suitable) with Python 3.11 or 3.12, a kubeconfig
  that reaches the cluster, and access to the application's HTTPS hostname.
- DNS for `app_hostname` pointing to the node. Permit HTTPS port 443 from clients,
  and Kubernetes API port 6443 from the controller if it is remote. Follow the
  [K3s networking requirements](https://docs.k3s.io/installation/requirements).
- An ingress controller and dynamic storage provisioner. K3s includes Traefik and
  the `local-path` provisioner. The provided ingress uses Traefik's `websecure`
  entrypoint; adapt annotations when using another controller.
- A TLS certificate/key for that hostname, trusted by browsers and the Ansible
  controller (install your internal CA in its trust store when applicable).
- Existing RSA JWT signing keys, a stable AES secret, MySQL credentials, and
  published frontend/server images. Preserve signing/AES keys across redeployments.

Production refresh cookies require HTTPS. Both application deployments use
`Recreate` to avoid overlapping replicas and storage contention on a single node;
updates have brief downtime. Local volumes do not provide high availability or
off-node backups. Back up MySQL, JWT/AES keys and persistent assets separately.

## Configure Ansible

From the repository root on Linux:

```sh
python3 -m venv deploy/ansible/.venv
. deploy/ansible/.venv/bin/activate
pip install -r deploy/ansible/requirements.txt
ansible-galaxy collection install -r deploy/ansible/requirements.yml
cp deploy/ansible/inventory.example.yml deploy/ansible/inventory.yml
cp deploy/ansible/site-vars.example.yml deploy/ansible/site-vars.yml
cp deploy/ansible/vault.example.yml deploy/ansible/vault.yml
```

Edit the three copied files. Image values should use `sha-<full-commit-sha>` tags
from CI (or immutable digests). `storage_size` is allocated **per PVC**. Certificate
and JWT paths are on the controller, not the target node. Use an absolute kubeconfig
path. For private Docker Hub repositories, provide a pull-capable
`registry_username` and `registry_password`; the latter belongs in the Vault file.

Encrypt the populated credentials file:

```sh
ansible-vault encrypt deploy/ansible/vault.yml
```

For a new application, generate a JWT key pair once and store it securely:

```sh
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out jwtRS256.key
openssl pkey -in jwtRS256.key -pubout -out jwtRS256.key.pub
openssl rand -hex 32
```

Use the random value as `aes_key`. Never regenerate keys on every CI run. Existing
installations should retain their current keys.

## Optional: install single-node K3s

Choose a tested release from [K3s releases](https://github.com/k3s-io/k3s/releases)
and put its exact version (including `+k3s1` or equivalent) in `k3s_version`.
Bootstrap only installs when K3s is absent; it does not upgrade existing clusters.

```sh
ansible-playbook -i deploy/ansible/inventory.yml deploy/ansible/bootstrap.yml \
  -e @deploy/ansible/site-vars.yml --ask-become-pass
```

K3s creates `/etc/rancher/k3s/k3s.yaml`. On a controller running on the node, securely
copy it to your configured kubeconfig path and make it readable only by the
deployment user. For a remote controller, securely copy it there and replace the
loopback `server` address with the node's reachable IP covered by the API server's
certificate. Do not commit this administrator credential. Existing clusters can
skip bootstrap and use their own kubeconfig.

## Deploy or update

```sh
ansible-playbook deploy/ansible/deploy.yml \
  -e @deploy/ansible/site-vars.yml \
  -e @deploy/ansible/vault.yml --ask-vault-pass
```

The playbook validates the single-node topology, applies secrets/resources, waits
for deployments, and checks the frontend and API over HTTPS. Secret changes update
the server pod template checksum, triggering a restart. Rerunning with identical
settings preserves the resources and data. To roll back application code, set both
image variables to a previously published commit and rerun. This does not roll back
database changes or application data. Do not delete PVCs or the namespace to update.

## GitHub Actions integration

The pipeline runs:

```text
frontend compile/build + server tests
                  |
         server + frontend images
                  |
          Ansible deployment
```

1. Keep the existing `DOCKERHUB_USERNAME`, `DOCKERHUB_IMAGE` variables and
   `DOCKERHUB_TOKEN` secret. Create a second Docker Hub repository and set
   `DOCKERHUB_FRONTEND_IMAGE`, e.g. `your-user/jwt-frontend`. This enables its image
   workflow. Both images receive `sha-<full-commit-sha>` tags.
2. Provision a dedicated Linux AMD64 self-hosted runner with labels `self-hosted`,
   `linux`, `x64`, `onprem`. It needs Python 3.11/3.12 with venv, network access to
   Kubernetes/HTTPS, and internet access for Python packages and Ansible collections.
   Restrict this runner to trusted deployment workflows; do not use it for PR jobs.
3. On that runner, place populated settings in `/etc/jwt-app/site-vars.yml`, encrypted
   credentials in `/etc/jwt-app/vault.yml`, and the Vault password in
   `/etc/jwt-app/vault-password`. Store kubeconfig, certificates and JWT keys at the
   paths referenced by the settings. Restrict all these files to the runner's user.
   A namespace-scoped deployment identity is preferable after initial provisioning;
   the playbook also requires permission to list nodes and ensure its namespace exists.
4. Create a GitHub environment named `onprem`, restrict deployment branches to
   `main`, and configure any deployment review policy your team uses.
5. Set repository variable `ONPREM_DEPLOY_ENABLED` to `true` after a successful
   manual deployment. Pushes or manual **Repository CI** runs on `main` will then
   deploy after both image publications succeed. The caller passes the current
   commit's image tags, overriding the values in the runner's settings file.

PRs never run the on-premises job. No cluster credentials are needed by build jobs.
Deployments are serialized and do not run bootstrap. Leave the enable variable
unset to keep deployment disabled. A failed rollout fails CI; inspect the cluster
and rerun with a known-good image to recover.

## Validation

```sh
ansible-playbook -i deploy/ansible/inventory.example.yml deploy/ansible/bootstrap.yml --syntax-check
ansible-playbook deploy/ansible/deploy.yml --syntax-check
pip install kubernetes-validate==1.36.0
ansible-playbook deploy/ansible/validate.yml
```

CI also renders both public/private registry configurations with synthetic secrets
and validates them against strict Kubernetes 1.34 schemas. Validation does not
contact a cluster. A real deployment is needed to verify
image pulls, storage, ingress, certificates and database access.

References: [K3s single-node installation](https://docs.k3s.io/quick-start),
[Ansible Kubernetes modules](https://docs.ansible.com/projects/ansible/latest/collections/kubernetes/core/k8s_module.html).
