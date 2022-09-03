import type { NextPage } from 'next';
import Head from 'next/head';
import { signIn, signOut, useSession } from 'next-auth/react';
import { trpc } from '../utils/trpc';
import { useState } from 'react';
import clsx from 'clsx';

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
				<h1 className='text-3xl font-bold bold-text pt-14 text-t-purple'>
					GuestBook
				</h1>
				<p className='pt-1 text-slate-200'>Leave a comment down below!</p>
				{session ? (
					<div className='pt-10'>
						<p className='text-xl mb-3'>Welcome {session.user?.name}</p>

						<div className='py-6'>
							<form
								onSubmit={(e) => {
									e.preventDefault();
									if (message.length > 0) {
										postMessage.mutate({
											name: session.user?.name as string,
											message,
										});
										setMessage(' ');
									}
								}}
								className='flex gap-2'>
								<div>
									<input
										type='text'
										placeholder='your message...'
										value={message}
										maxLength={100}
										onChange={({ target }) => setMessage(target.value)}
										className='w-full px-4 py-2 mt-1 text-xl border-2 rounded-md bg-zinc-800 focus:outline-none focus:border-opacity-100 border-opacity-80 border-t-pink text-slate-200'
									/>
									<div className='flex justify-between items-center'>
										<p
											className={clsx(
												'text-lg',
												message.length > 100 ? 'text-t-red' : 'text-t-pink'
											)}>
											{message.length}/100
										</p>
										<div className=''>
											<button
												type='button'
												className='px-3 py-2 mt-2 text-sm transition-colors duration-300 border-2 rounded-md cursor-pointer border-opacity-80 border-t-purple hover:bg-t-purple hover:bg-opacity-30 hover:text-white'
												onClick={() => {
													signOut();
												}}>
												Log Out
											</button>
											<button
												type='submit'
												className='ml-4 px-3 py-2 mt-2 text-sm transition-colors duration-300 border-2 rounded-md cursor-pointer border-opacity-80 border-t-purple hover:bg-t-purple hover:bg-opacity-30 hover:text-white disabled:opacity-80'>
												Submit
											</button>
										</div>
									</div>
								</div>
							</form>
						</div>

						<div className='p10'>
							<Messages />
						</div>
					</div>
				) : (
					<div>
						<button
							className='px-3 py-2 my-8 text-sm transition-colors duration-300 border-2 rounded-md cursor-pointer border-opacity-80 border-t-purple hover:bg-t-purple hover:bg-opacity-30 hover:text-white'
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
					<div className='flex flex-col' key={i}>
						<p className='text-sm md:text-xl'>{m.message}</p>
						<p className='text-t-pink sm:text-sm md:text-base'>- {m.name}</p>
					</div>
				);
			})}
		</div>
	);
};

export default Home;
