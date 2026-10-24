# Needs ignore the builder profile

Distills build needs from signals alone. Only idea generation reads the builder profile. Filtering needs by profile would make a single-user pipeline cheaper, since irrelevant needs would never be matched or stored. We chose against it so needs stay true for any reader. If the tool gains more users, sources and needs can be shared, and only ideas become per user. The costly matching work then runs once instead of once per user.
