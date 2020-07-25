// import AppError from '../errors/AppError';

import { getRepository, getCustomRepository } from 'typeorm';

import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

import AppError from '../errors/AppError';

interface Request {
  title: string;
  value: number;
  type: string;
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);

    const balance = await transactionsRepository.getBalance();

    if (type !== 'outcome' && type !== 'income') {
      throw new AppError(
        'Invalid transaction type. Should be either income or outcome',
      );
    }

    if (value < 0) {
      throw new AppError('Invalid value for transaction. Should be positive');
    }

    if (type === 'outcome' && balance.total - value < 0) {
      throw new AppError('Insufficient funds to carry out transaction');
    }

    const transaction = transactionsRepository.create({ title, value, type });
    const storedCategory = await categoriesRepository.findOne({
      where: { title: category },
    });

    if (!storedCategory) {
      const newCategory = categoriesRepository.create({ title: category });
      transaction.category = newCategory;
      await categoriesRepository.save(newCategory);
    } else {
      transaction.category = storedCategory;
    }

    await transactionsRepository.save(transaction);
    return transaction;
  }
}

export default CreateTransactionService;
