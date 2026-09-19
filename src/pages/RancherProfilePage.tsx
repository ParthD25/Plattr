import { Link, useParams } from 'react-router-dom'
import { Loading, useData } from '../components/ui'
import { loadClaims, loadPlants, loadRanchers } from '../data'
import ProfileView from '../rancher/ProfileView'

export default function RancherProfilePage() {
  const { slug } = useParams()
  const ranchers = useData(loadRanchers)
  const claims = useData(loadClaims)
  const plants = useData(loadPlants)   // ponytail: 3.4 MB even for a profile with no processor; split the token index out if phones struggle

  const error = ranchers.error ?? claims.error ?? plants.error
  if (error) return <p role="alert">{error}</p>
  if (!ranchers.data || !claims.data || !plants.data) return <Loading what="rancher profile" />

  const rancher = ranchers.data.ranchers.find(r => r.slug === slug && (r.status === 'sample' || r.status === 'published'))
  if (!rancher) return (
    <>
      <h1>Profile not found</h1>
      <p>There is no published rancher profile at this address. <Link to="/ranchers">See the sample profiles and how ranchers join</Link>.</p>
    </>
  )
  return <ProfileView rancher={rancher} claims={claims.data} plants={plants.data} />
}
