import type { NextPage } from 'next';
import Head from 'next/head';
import { signIn, signOut, useSession } from 'next-auth/react';
import { trpc } from '../utils/trpc';
import { useState } from 'react';

const Home: NextPage = () => {
	const [message, setMessage] = useState('');
	const { data: session, status } = useSession();
	const ctx = trpc.useContext();
	const postMessage = trpc.useMutation('guestbook.postMessage', {
		onMutate: () => {
			ctx.cancelQuery(['guestbook.getAll']);

			const optimisticUpdate = ctx.getQueryData(['guestbook.getAll']);
			if (optimisticUpdate) {
				ctx.setQueryData(['guestbook.getAll'], optimisticUpdate);
			}
		},
		onSettled: () => {
			ctx.invalidateQueries(['guestbook.getAll']);
		},
	});

	if (status === 'loading') {
		return <div>Loading...</div>;
	}

	return (
		<>
			<Head>
				<title>GuestBook</title>
			</Head>

			<main className='flex flex-col items-center'>
				<h1 className='text-3xl pt-4'>GuestBook</h1>
				{session ? (
					<div className='pt-10'>
						<p className='text-xl mb-3'>hi {session.user?.name}</p>
						<button
							className='p-2 rounded-md border-2 border-zinc-800 focus:outline-none'
							onClick={() => signOut()}>
							Logout
						</button>

						<div className='py-6'>
							<form
								onSubmit={(e) => {
									e.preventDefault();

									postMessage.mutate({
										name: session.user?.name as string,
										message,
									});
									setMessage(' ');
								}}
								className='flex gap-2'>
								<input
									type='text'
									placeholder='your message...'
									value={message}
									maxLength={100}
									onChange={({ target }) => setMessage(target.value)}
									className='px-4 py-2 rounded-md border-2 border-zinc-800 bg-neutral-900 focus:outline-none'
								/>
								<button className='p-2 rounded-md border-2 border-zinc-800 focus:outline-none'>
									Submit
								</button>
							</form>
						</div>

						<div className='p10'>
							<Messages />
						</div>
					</div>
				) : (
					<div>
						<button
							className='p-2 rounded-md border-2 border-zinc-800 focus:outline-none my-4'
							onClick={() => signIn('discord')}>
							Login With Discord
						</button>

						<div className='p10'>
							<Messages />
						</div>
					</div>
				)}
			</main>
		</>
	);
};

const Messages = () => {
	const { data: messages, isLoading } = trpc.useQuery(['guestbook.getAll']);

	if (isLoading) return <div>Fetching Messages...</div>;

	return (
		<div className='flex flex-col gap-4'>
			{messages?.map((m: { name: string; message: string }, i: number) => {
				return (
					// eslint-disable-next-line react/no-unknown-property
					<div key={i}>
						<p>{m.message}</p>
						<span>- {m.name}</span>
					</div>
				);
			})}
		</div>
	);
};

export default Home;
