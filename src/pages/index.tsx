import type { NextPage } from 'next';
import Head from 'next/head';
import { signIn, signOut, useSession } from 'next-auth/react';

const Home: NextPage = () => {
	const { data: session, status } = useSession();

	if (status === 'loading') {
		return <div>Loading...</div>;
	}

	return (
		<>
			<Head>
				<title>GuestBook</title>
			</Head>

			<main className='container mx-auto flex flex-col items-center justify-center min-h-screen p-4'>
				<h1>GuestBook</h1>
				{session ? (
					<div>
						<p>hi {session.user?.name}</p>
						<button onClick={() => signOut()}>Logout</button>
					</div>
				) : (
					<div>
						<button onClick={() => signIn('discord')}>
							Login With Discord
						</button>
					</div>
				)}
			</main>
		</>
	);
};

export default Home;
